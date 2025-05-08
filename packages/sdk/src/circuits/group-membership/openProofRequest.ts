
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
  
  const popup = window.open(url, "_blank");

  const payload = {
    whitelist,
    nonce: sessionNonce,
    issued_at: issuedAt,
  };

  console.log("Dispatching to popup:", payload);
  
  const origin = "https://zkdev.net";

  const timer = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(timer);
      return;
    }
    try {
      popup.postMessage(payload, origin);
      clearInterval(timer);
    } catch {
      console.warn("postMessage failed, retrying...");
    }
  }, 200);
}