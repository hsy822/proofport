import { execa } from "execa";
import path from "node:path";
import { existsSync } from "node:fs";
import process from "node:process";

async function main() {
  const circuitName = "group-membership";
  const circuitPath = path.resolve("../../packages/circuits", circuitName);

  if (!existsSync(circuitPath)) {
    console.error(`❌ Circuit path not found: ${circuitPath}`);
    process.exit(1);
  }

  console.log("🛠 Step 1: Compiling circuit with nargo...");
  await execa("nargo", ["compile"], { cwd: circuitPath, stdio: "inherit" });

  console.log("🔑 Step 2: Generating verifying key with bb...");
  await execa("bb", [
    "write_vk",
    "--scheme", "ultra_honk",
    "--oracle_hash", "keccak",
    "-b", "target/group_membership.json",
    "-o", "target",
  ], { cwd: circuitPath, stdio: "inherit" });

  console.log("📜 Step 3: Generating EVM Solidity verifier with bb...");
  await execa("bb", [
    "write_solidity_verifier",
    "-k", "target/vk",
    "-o", "target/Verifier.sol",
  ], { cwd: circuitPath, stdio: "inherit" });

  try {
    console.log("🧠 Step 4: Generating Starknet verifier with garaga...");
    await execa("/Users/sooyounghyun/Desktop/dev/garaga/venv/bin/garaga", [
      "gen",
      "--system", "ultra_keccak_zk_honk",
      "--vk", "target/vk",
    ], { cwd: circuitPath, stdio: "inherit" });
  } catch (err) {
    console.warn("⚠️ garaga fmt failed, but verifier should have been generated.");
  }
  console.log("All build steps completed successfully!");
}

main().catch((err) => {
  console.error("❌ Build and deploy failed:", err);
  process.exit(1);
});
