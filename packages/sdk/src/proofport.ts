import { ProofRequestParams, ProofVerifyParams } from "./types.js";
import { getRegistryEntry } from "./registry.js";
import { Contract, ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { arrayify } from "@ethersproject/bytes";

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

  // Optional: base64-encoded metadata (e.g., Merkle tree)
  if (metadata?.tree) {
    query.append("tree", metadata.tree);
  }

  return `${PROOFPORT_BASE_URL}?${query.toString()}`;
}

// Placeholder ABI (must match generated Solidity verifier ABI)
const HONK_VERIFIER_ABI = [
    "function verify(bytes proof, uint256[] publicInputs) public view returns (bool)"
];

/**
 * Verifies the proof on-chain by calling the verifier smart contract.
 * Must be called with a signer (wallet-connected account) that can send the transaction.
 */
export async function verifyProof(
    params: ProofVerifyParams,
    signer: ethers.Signer
  ): Promise<boolean> {
  const { circuitId, chainId, publicInputs, proof } = params;

  const registryEntry = await getRegistryEntry(circuitId);
  const chain = registryEntry.chains[chainId];

  if (!chain?.evm_address) {
    throw new Error(`Verifier not found for circuit '${circuitId}' on chain '${chainId}'`);
  }

  const publicInputsArray = registryEntry.public_inputs.map((key) => {
    const val = publicInputs[key];
    if (!val) throw new Error(`Missing public input: ${key}`);
    return BigNumber.from(val);
  });

  const contract = new Contract(chain.evm_address, HONK_VERIFIER_ABI, signer);
  const proofBytes = arrayify(proof);

  // Send the verification tx
  const tx = await contract.verify(proofBytes, publicInputsArray);
  const receipt = await tx.wait();

  // Optionally parse events or just return status
  return receipt.status === 1;
}