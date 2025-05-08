import { execa } from "execa";
import path from "node:path";
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import process from "node:process";
import fetch from "node-fetch";
import "dotenv/config";
import { execSync } from "node:child_process";

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

const startnetUrl = "http://localhost:5050";
const ethereumUrl = "http://localhost:8545";

// Parse CIP metadata
function parseCIPMetadata(circuitName) {
  const cipsDir = path.resolve("../../docs/cips");
  const files = readdirSync(cipsDir);
  const cipFile = files.find(file =>
    file.endsWith(".md") &&
    file.toLowerCase().includes(circuitName.toLowerCase())
  );

  if (!cipFile) throw new Error(`No CIP markdown file found for circuit: ${circuitName}`);

  const cipPath = path.join(cipsDir, cipFile);
  const content = readFileSync(cipPath, "utf8");
  const metadataBlock = content.split("## 0. Metadata")[1]?.split("---")[0];
  if (!metadataBlock) throw new Error(`Metadata section not found in CIP: ${cipPath}`);

  const getField = (field) => metadataBlock.match(new RegExp(`${field}:\\s*(.*)`))?.[1]?.trim();

  return {
    circuit_id: getField("circuit_id"),
    version: getField("version"),
    description: getField("description")
  };
}

function tryGitPushIfAvailable() {
  try {
    if (process.env.IS_OPERATOR === "true") {
      execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

      execSync("git add ../../packages/registry/verifier_registry.json", { stdio: "inherit" });
      execSync(`git commit -m "chore: update verifier_registry for ${new Date().toISOString()}"`, {
        stdio: "inherit"
      });

      execSync("git push", { stdio: "inherit" });
      console.log(`${colors.green} Git commit and push complete.${colors.reset}`);
    } else {
      console.log(`${colors.cyan} Git push skipped: operator-only functionality or no Git repo found.${colors.reset}`);
    }
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  const circuitName = process.argv[2];

  if (!circuitName) {
    console.error(`${colors.red}Error: Please provide a circuit name as an argument.${colors.reset}`);
    process.exit(1);
  }

  const circuitPath = path.resolve("../../packages/circuits", circuitName);
  const verifierOutputPath = path.join(circuitPath, "target", "Verifier.sol");
  const circuitJsonPath = path.join(circuitPath, "target", `${circuitName.replace(/-/g, "_")}.json`);

  if (!existsSync(circuitPath)) {
    console.error(`${colors.red}Error: Circuit path not found: ${circuitPath}${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n### Step 1: Compiling Noir circuit '${circuitName}'`);
  console.log("---");
  await execa("nargo", ["compile"], { cwd: circuitPath, stdio: "inherit" });

  console.log(`\n### Step 2: Generating Verification Key (VK)`);
  console.log("---");
  await execa("bb", [
    "write_vk",
    "--scheme", "ultra_honk",
    "--oracle_hash", "keccak",
    "-b", `target/${circuitName.replace(/-/g, "_")}.json`,
    "-o", "target",
  ], { cwd: circuitPath, stdio: "inherit" });

  console.log(`\n### Step 3: Generating Solidity Verifier contract`);
  console.log("---");
  await execa("bb", [
    "write_solidity_verifier",
    "-k", "target/vk",
    "-o", "target/Verifier.sol",
  ], { cwd: circuitPath, stdio: "inherit" });

  console.log(`\n### Step 4: Generating Starknet Verifier with Garaga`);
  console.log("---");
  try {
    await execa("/Users/sooyounghyun/Desktop/dev/garaga/venv/bin/garaga", [
      "gen",
      "--system", "ultra_keccak_honk",
      "--vk", "target/vk",
      "--project-name", "verifier",
    ], { cwd: circuitPath, stdio: "inherit" });
  } catch (err) {
    console.warn(`${colors.red}Warning: Garaga formatting failed, continuing...${colors.reset}`);
  }

  console.log(`\n### Step 5: Fetching Predeployed Starknet Account`);
  console.log("---");
  const accountsResponse = await fetch(startnetUrl+"/predeployed_accounts");
  const accounts = await accountsResponse.json();
  const firstAccount = accounts[0];

  const accountsFilePath = path.join(circuitPath, "accounts.json");
  writeFileSync(accountsFilePath, JSON.stringify({
    "alpha-sepolia": { "devnet0": firstAccount }
  }, null, 2));

  console.log(`\n### Step 6: Building and Deploying to Local EVM (Anvil)`);
  console.log("---");
  await execa("forge", ["build"], { cwd: circuitPath, stdio: "inherit" });

  const evmDeployResult = await execa("forge", [
    "create",
    "--rpc-url", ethereumUrl,
    "--private-key", process.env.PRIVATE_KEY,
    "--broadcast",
    `${verifierOutputPath}:HonkVerifier`
  ], { stdio: "pipe" });

  const evmAddressMatch = evmDeployResult.stdout.match(/Deployed to: (0x[a-fA-F0-9]+)/);
  const evmAddress = evmAddressMatch ? evmAddressMatch[1] : "";
  console.log(`EVM Verifier deployed at address: ${colors.cyan}${evmAddress}${colors.reset}`);

  console.log(`\n### Step 7: Declaring and Deploying Starknet Contract`);
  console.log("---");
  
  const declareResult = await execa("sncast", [
    "--account", "devnet0",
    "--accounts-file", accountsFilePath,
    "declare",
    "--contract-name", "UltraKeccakHonkVerifier",
    "--url", startnetUrl,
  ], { cwd: path.join(circuitPath, "verifier"), stdio: "pipe" });

  const classHashMatch = declareResult.stdout.match(/class_hash:\s*(0x[0-9a-fA-F]+)/);
  const classHash = classHashMatch ? classHashMatch[1] : "";
  console.log(`Starknet Class Hash: ${colors.cyan}${classHash}${colors.reset}`);

  const deployResult = await execa("sncast", [
    "--account", "devnet0",
    "--accounts-file", accountsFilePath,
    "deploy",
    "--class-hash", classHash,
    "--url", startnetUrl,
  ], { cwd: path.join(circuitPath, "verifier"), stdio: "pipe" });

  const contractAddressMatch = deployResult.stdout.match(/contract_address:\s*(0x[0-9a-fA-F]+)/);
  const starknetAddress = contractAddressMatch ? contractAddressMatch[1] : "";

  if (!starknetAddress) {
    throw new Error("❌ Failed to parse Starknet contract address.");
  }

  console.log(`Starknet Contract Address: ${colors.cyan}${starknetAddress}${colors.reset}`);

  console.log(`\n### Step 8: Updating Verifier Registry`);
  console.log("---");

  // Fetch metadata from CIP
  const { circuit_id, version, description } = parseCIPMetadata(circuitName);
  const compiledCircuit = JSON.parse(readFileSync(circuitJsonPath, "utf-8"));
  const { noir_version, abi, hash, bytecode } = compiledCircuit;

  const public_inputs = abi.parameters
    .filter(p => p.visibility === "public")
    .map(p => p.name);
    
  // Update registry
  const registryPath = path.resolve("../../packages/registry/verifier_registry.json");
  const existingRegistry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath)) : {};

  const chainIdEvm = "anvil";              // local EVM
  const chainIdStarknet = "starknet-devnet"; // local Starknet

  existingRegistry[circuit_id] = {};

  existingRegistry[circuit_id] = {
    circuit_id,
    version,
    description,
    public_inputs,
    metadata: {
      noir_version,
      hash,
      abi,
      bytecode
    },
    chains: {
      [chainIdEvm]: {
        evm_address: evmAddress,
        deployed_at: new Date().toISOString()
      },
      [chainIdStarknet]: {
        starknet_address: starknetAddress,
        deployed_at: new Date().toISOString()
      }
    }
  };

  writeFileSync(registryPath, JSON.stringify(existingRegistry, null, 2));

  // console.log(`\n### Step 8.5: Saving Verification Key (VK) to Registry`);
  // console.log("---");
  // const vkSourcePath = path.join(circuitPath, "target", "vk");
  // const vkDestinationPath = path.resolve("../../packages/registry", `vk_${circuit_id}.bin`);

  // if (!existsSync(vkSourcePath)) {
  //   throw new Error(`Verification key not found at: ${vkSourcePath}`);
  // }

  // const vkContent = readFileSync(vkSourcePath, "utf-8");
  // writeFileSync(vkDestinationPath, vkContent);
  // console.log(`Saved VK to: ${colors.cyan}${vkDestinationPath}${colors.reset}`);

  console.log(`\n### Step 9: Cleaning up Build Artifacts`);
  console.log("---");
  const rootOutPath = path.resolve("../../out");
  const rootCachePath = path.resolve("../../cache");
  rmSync(rootOutPath, { recursive: true, force: true });
  rmSync(rootCachePath, { recursive: true, force: true });

  console.log(`\n${colors.green}✔ Build, deploy, and registry update completed successfully.${colors.reset}\n`);

  console.log(`\n### Step 10: Pushing Registry to Git (if operator)`);
  console.log("---");
  tryGitPushIfAvailable();
}

main().catch((err) => {
  console.error(`${colors.red}\n Error: Build-and-Deploy process failed.${colors.reset}\n`, err);
  process.exit(1);
});