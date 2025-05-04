import { useEffect, useState } from "react";

interface ProofData {
  proof: string;
  circuitId: string;
  publicInputs: Record<string, string>;
  calldata?: any;
}

export function useProofListener() {
  const [data, setData] = useState<ProofData | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data?.proof || !event.data?.publicInputs) return;
      if (typeof event.data.proof !== "string") return;
      if (typeof event.data.circuitId !== "string") return;

      setData({
        proof: event.data.proof,
        circuitId: event.data.circuitId,
        publicInputs: event.data.publicInputs,
        calldata: event.data.calldata
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return data;
}
