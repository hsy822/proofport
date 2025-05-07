
import { getProofRequestUrl } from "../../proofport.js";
import { createMerkleRoot } from "./createMerkleArtifacts.js";

export function openGroupMembershipProofRequest(chainId: string, whitelist: string[], sessionNonce: string, issuedAt: number) {

  const root = createMerkleRoot(whitelist);
  const url = getProofRequestUrl({
    circuitId: "group-membership",
    chainId,
    publicInputs: { root },
    metadata: {
      nonce: sessionNonce,
      issued_at: issuedAt,
    }
  });
  
  const win = window.open(url, "_blank");
  if (win) {
    win.name = JSON.stringify({ whitelist, nonce: sessionNonce, issued_at: issuedAt });
  }
}