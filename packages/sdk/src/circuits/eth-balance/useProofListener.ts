import { useEffect, useState } from "react";

interface ProofData {
  proof: string;
  circuitId: string;
  publicInputs: Record<string, string>;
  calldata?: any;
  issued_at?: number;
  nonce?: string;
}

interface Options {
  expectedNonce: string;
  maxAgeMs?: number; // default 5 minutes
  allowedOrigin?: string; // optional origin check
}

export function useProofListenerWithValidation({
  expectedNonce,
  maxAgeMs = 300_000,
  allowedOrigin,
}: Options) {
  const [data, setData] = useState<ProofData | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      console.log("Received message:", msg);
      console.log("Origin:", event.origin);
  
      if (!msg?.proof || typeof msg.proof !== "string") {
        console.warn("Invalid or missing 'proof'");
        return;
      }
  
      if (!msg?.circuitId || typeof msg.circuitId !== "string") {
        console.warn("Invalid or missing 'circuitId'");
        return;
      }
  
      if (!msg?.publicInputs || typeof msg.publicInputs !== "object") {
        console.warn("Invalid or missing 'publicInputs'");
        return;
      }
  
      if (allowedOrigin && event.origin !== allowedOrigin) {
        console.warn(`Origin mismatch: expected ${allowedOrigin}, got ${event.origin}`);
        return;
      }
  
      if (msg.nonce !== expectedNonce) {
        console.warn(`Nonce mismatch: expected ${expectedNonce}, got ${msg.nonce}`);
        return;
      }
  
      if (msg.issued_at && Date.now() - msg.issued_at > maxAgeMs) {
        console.warn(`Message too old: issued_at=${msg.issued_at}, now=${Date.now()}`);
        return;
      }

      console.log("Valid message, storing proof data.");
      setData({
        proof: msg.proof,
        circuitId: msg.circuitId,
        publicInputs: msg.publicInputs,
        calldata: msg.calldata,
        issued_at: msg.issued_at,
        nonce: msg.nonce,
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [expectedNonce, maxAgeMs, allowedOrigin]);
  
  return data;
}
