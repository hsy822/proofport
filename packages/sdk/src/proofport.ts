import { ProofRequestParams, ProofVerifyParams } from "./types.js";
import { getRegistryEntry } from "./registry.js";
import { Contract, ethers } from "ethers";
import { arrayify, hexZeroPad } from "@ethersproject/bytes";
import { Contract as StartnetContract, RpcProvider } from "starknet";
const PROOFPORT_BASE_URL = "http://localhost:3001/docs/proofport/hello";

/**
 * Generate the URL to redirect the user to Proofport proof creation page
 * Includes publicInputs and optional metadata (e.g., Merkle tree)
 */
export function getProofRequestUrl(params: ProofRequestParams): string {
  const { circuitId, chainId, publicInputs, metadata } = params;

  const query = new URLSearchParams({
    circuit_id: circuitId,
    chain_id: chainId,
    ...publicInputs,
  });

  // Optional: Merkle proof metadata
  if (circuitId === "group-membership" && metadata) {
    if (metadata.tree) query.append("tree", metadata.tree);
  }
  
  if (metadata?.nonce) query.append("nonce", metadata.nonce);
  if (metadata?.issued_at) query.append("issued_at", metadata.issued_at.toString());
  
  return `${PROOFPORT_BASE_URL}?${query.toString()}`;
}

// Placeholder ABI (must match generated Solidity verifier ABI)
const HONK_VERIFIER_ABI = [
    "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
];

function isEvmChain(chainId: string): boolean {
  return ["anvil", "sepolia", "mainnet"].includes(chainId); 
}

/**
 * Verifies the proof on-chain by calling the verifier smart contract.
 */
export async function verifyProof(
  params: ProofVerifyParams,
  signer: ethers.Signer | any
) {
  const { chainId } = params;

  if (isEvmChain(chainId)) {
    return await verifyProofOnEvm(params, signer as ethers.Signer);
  } else {
    return await verifyProofOnStarknet(params); 
  }
}

async function verifyProofOnEvm(
  params: ProofVerifyParams,
  signer: ethers.Signer
) {
  const { circuitId, chainId, publicInputs, proof } = params;

  const registryEntry = await getRegistryEntry(circuitId);
  const chain = registryEntry.chains[chainId];

  if (!chain?.evm_address) {
    throw new Error(`Verifier not found for circuit '${circuitId}' on chain '${chainId}'`);
  }

  const publicInputsArray = registryEntry.public_inputs.map((key) => {
    const val = (publicInputs as Record<string, string>)[key];;
    if (!val) throw new Error(`Missing public input: ${key}`);
    return hexZeroPad(val, 32);
  });

  const contract = new Contract(chain.evm_address, HONK_VERIFIER_ABI, signer);
  const proofBytes = arrayify(proof);

  try {
    return await contract.verify(proofBytes, publicInputsArray);
  } catch (err: any) {
    console.error("Verification failed:", err);
    throw err;
  }
}

export async function verifyProofOnStarknet(params: ProofVerifyParams) {
  const { circuitId, chainId, publicInputs, proof, calldata } = params;

  try {
    console.log("Starting Starknet proof verification...");

    const provider = new RpcProvider({ nodeUrl: 'http://localhost:5050/rpc' });

    console.log("Provider initialized:", provider);

    const registry = await getRegistryEntry(circuitId);
    const chainInfo = registry.chains[chainId];

    if (!chainInfo?.starknet_address) throw new Error("Verifier not deployed on Starknet");
    const verifierAddress = chainInfo.starknet_address;

    console.log("Using verifier address:", verifierAddress)

    const abi = [{"type":"impl","name":"IUltraKeccakHonkVerifier","interface_name":"verifier::honk_verifier::IUltraKeccakHonkVerifier"},{"type":"struct","name":"core::array::Span::<core::felt252>","members":[{"name":"snapshot","type":"@core::array::Array::<core::felt252>"}]},{"type":"struct","name":"core::integer::u256","members":[{"name":"low","type":"core::integer::u128"},{"name":"high","type":"core::integer::u128"}]},{"type":"struct","name":"core::array::Span::<core::integer::u256>","members":[{"name":"snapshot","type":"@core::array::Array::<core::integer::u256>"}]},{"type":"enum","name":"core::option::Option::<core::array::Span::<core::integer::u256>>","variants":[{"name":"Some","type":"core::array::Span::<core::integer::u256>"},{"name":"None","type":"()"}]},{"type":"interface","name":"verifier::honk_verifier::IUltraKeccakHonkVerifier","items":[{"type":"function","name":"verify_ultra_keccak_honk_proof","inputs":[{"name":"full_proof_with_hints","type":"core::array::Span::<core::felt252>"}],"outputs":[{"type":"core::option::Option::<core::array::Span::<core::integer::u256>>"}],"state_mutability":"view"}]},{"type":"event","name":"verifier::honk_verifier::UltraKeccakHonkVerifier::Event","kind":"enum","variants":[]}]
  
    const verifierContract = new StartnetContract(abi, verifierAddress, provider);

    console.log("Calling contract...");
  
    let result;
    try {
      result = await verifierContract.verify_ultra_keccak_honk_proof(calldata.slice(1));
    } catch (error) {
      console.log(error)
    }
    console.log("Verification result:", result);
    return result;
  } catch (err: any) {
    console.error("Verification failed");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    console.error("Raw proof (hex):", proof);
    return null;
  }
}
