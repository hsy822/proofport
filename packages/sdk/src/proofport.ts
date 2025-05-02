import { ProofRequestParams, ProofVerifyParams } from "./types.js";
import { getRegistryEntry } from "./registry.js";
import { Contract, ethers } from "ethers";
import { arrayify, hexZeroPad } from "@ethersproject/bytes";

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
  if (metadata?.leaf) query.append("leaf", metadata.leaf);
  if (metadata?.index) query.append("index", metadata.index);
  if (metadata?.hashpath) query.append("hashpath", metadata.hashpath); // Already stringified JSON
  if (metadata?.tree) query.append("tree", metadata.tree); // Optional fallback

  return `${PROOFPORT_BASE_URL}?${query.toString()}`;
}

// Placeholder ABI (must match generated Solidity verifier ABI)
const HONK_VERIFIER_ABI = [
    "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
];

/**
 * Verifies the proof on-chain by calling the verifier smart contract.
 * Must be called with a signer (wallet-connected account) that can send the transaction.
 */
export async function verifyProof(
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
    const val = publicInputs[key];
    if (!val) throw new Error(`Missing public input: ${key}`);
    return hexZeroPad(val, 32);
  });

  const contract = new Contract(chain.evm_address, HONK_VERIFIER_ABI, signer);

  const proofBytes = arrayify(proof);

  console.log("proofBytes.length:", proofBytes.length); // Expect: ~14080
  console.log("publicInputsArray.length:", publicInputsArray.length);

  try {
    const result = await contract.verify(proofBytes, publicInputsArray);
    console.log("Verification result:", result);
    return result;
  } catch (err: any) {
    console.error("Verification failed:", err);
    if (err?.reason) console.error("Revert reason:", err.reason);
    if (err?.error?.message) console.error("EVM error message:", err.error.message);
  }
}
