
import { getProofRequestUrl } from "../../proofport.js";
import { createMerkleRoot } from "./createMerkleArtifacts.js";

export function openGroupMembershipProofRequest(
  chainId: string,
  whitelist: string[],
  sessionNonce: string,
  issuedAt: number
) {
  const root = createMerkleRoot(whitelist);
  const url = getProofRequestUrl({
    circuitId: "group-membership",
    chainId,
    publicInputs: { root },
    metadata: {
      nonce: sessionNonce,
      issued_at: issuedAt,
    },
  });

  const popup = window.open(url, "_blank");
  const origin = "https://zkdev.net";

  const payload = {
    whitelist,
    nonce: sessionNonce,
    issued_at: issuedAt,
  };

  let attempts = 0;
  const maxAttempts = 15;

  const timer = setInterval(() => {
    if (!popup || popup.closed || attempts >= maxAttempts) {
      clearInterval(timer);
      return;
    }
    try {
      popup.postMessage(payload, origin);
      console.log("retrying postMessage:", payload);
      attempts++;
    } catch (e) {
      console.warn("postMessage attempt failed:", e);
    }
  }, 200);
}
