
import { getProofRequestUrl } from "../../proofport.js";

export function openEthBalanceProofRequest(
  chainId: string,
  threshold: string,
  sessionNonce: string,
  issuedAt: number
) {
  const url = getProofRequestUrl({
    circuitId: "eth-balance",
    chainId,
    publicInputs: { threshold },
    metadata: {
      nonce: sessionNonce,
      issued_at: issuedAt,
    }
  });

  const popup = window.open(url, "_blank");

  const payload = {
    threshold,
    nonce: sessionNonce,
    issued_at: issuedAt,
  };

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
