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
    },
  });

  const popup = window.open(url, "_blank");

  const payload = {
    threshold,
    nonce: sessionNonce,
    issued_at: issuedAt,
  };

  const origin = "https://zkdev.net";

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
    } catch {
      console.warn("postMessage attempt failed");
    }
  }, 200);
}
