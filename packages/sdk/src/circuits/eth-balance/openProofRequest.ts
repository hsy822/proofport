
import { getProofRequestUrl } from "../../proofport.js";

export function openEthBalanceProofRequest(chainId: string, threshold: string, sessionNonce: string, issuedAt: number) {
  const url = getProofRequestUrl({
    circuitId: "eth-balance",
    chainId,
    publicInputs: { threshold },
    metadata: {
      nonce: sessionNonce,
      issued_at: issuedAt,
    }
  });

  const win = window.open(url, "_blank");
  if (win) win.name = JSON.stringify({ threshold, nonce: sessionNonce, issued_at: issuedAt });
}