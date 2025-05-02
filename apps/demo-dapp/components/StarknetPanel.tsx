import React, { useEffect, useState } from "react";
import { getProofRequestUrl, verifyProof } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

export function StarknetPanel() {
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");
  const [root, setRoot] = useState("");
  const [circuitId, setCircuitId] = useState("");

  const chainId = "starknet-testnet";

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data?.proof || !event.data?.publicInputs) return;
      setProof(event.data.proof);
      setRoot(event.data.publicInputs.root);
      setCircuitId(event.data.circuitId);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleGenerateProof = () => {
    const url = getProofRequestUrl({
      circuitId: "follower-over-100",
      chainId,
      publicInputs: { root: "0xplaceholder" }, // placeholder, 실제 트윗 연동 시 수정
    });
    window.open(url, "_blank");
  };

  const handleVerify = async () => {
    setStatus("verifying");
    try {
      const provider = new JsonRpcProvider("http://localhost:8545");
      const wallet = Wallet.createRandom().connect(provider);
      const ok = await verifyProof(
        { circuitId, chainId, publicInputs: { root }, proof },
        wallet
      );
      setStatus(ok ? "success" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  return (
    <div className="border border-purple-300 bg-purple-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-purple-900">Starknet Social Gate</h2>
      <p className="text-sm text-gray-700 mb-4">
        Prove that your Twitter account has over 100 followers — without revealing your handle.
      </p>

      <button className="mt-4 px-4 py-2 bg-purple-700 text-white rounded w-full" onClick={handleGenerateProof}>
        Generate Social Proof
      </button>

      <textarea
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder="0x..."
        rows={4}
        className="w-full p-2 border rounded mt-4 bg-white"
      />

      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full" onClick={handleVerify}>
        Submit for Verification
      </button>

      {proof && status === "idle" && (
        <p className="mt-4 text-purple-600">Proof received. Ready to verify on-chain.</p>
      )}
      {status === "verifying" && <p className="mt-4 text-gray-500">Verifying on-chain...</p>}
      {status === "success" && <p className="mt-4 text-green-600 font-semibold">Proof verified successfully.</p>}
      {status === "fail" && <p className="mt-4 text-red-600 font-semibold">Verification failed.</p>}
    </div>
  );
}
