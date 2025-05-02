import React, { useEffect, useState } from "react";
import { createMerkleProof, getProofRequestUrl, verifyProof } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

const whitelist = [
  "0xad94ba6edaeb297efc012429e70467c0725692e3",
  "0x4Ca47a1126f0A806cDC0AAa2268446A09D6A7CD6",
  "0x0D27320672eB296d39dF4c57e36B6b199091ECB5",
  "0x8A50Fb1B8F164AC74fBee2966b9C26C6A985847D",
];

export function EthereumPanel() {
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");
  const [root, setRoot] = useState("");
  const [circuitId, setCircuitId] = useState("");

  const chainId = "anvil";

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

  const handleGenerateProof = async () => {
    const { root, leaf, index, path } = createMerkleProof(whitelist);
    const url = getProofRequestUrl({
      circuitId: "group-membership",
      chainId,
      publicInputs: { root },
      metadata: {
        leaf,
        index: index.toString(),
        hashpath: JSON.stringify(path),
      },
    });
    window.open(url, "_blank");
  };

  const handleVerify = async () => {
    setStatus("verifying");
    try {
      const provider = new JsonRpcProvider("http://localhost:8545");
      const wallet = Wallet.createRandom().connect(provider);
      const ok = await verifyProof({ circuitId, chainId, publicInputs: { root }, proof }, wallet);
      setStatus(ok ? "success" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  return (
    <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-6">
      <h2 className="text-xl font-bold text-yellow-900 mb-2">💡 Ethereum DApp</h2>
      <p className="text-sm text-gray-700 mb-4">
        Prove that your Ethereum wallet is in the allowlist — without revealing which one.
      </p>

      <div className="mb-4 text-sm text-gray-700">
        <p className="font-medium">Allowlist:</p>
        <ul className="ml-4 list-disc text-xs">
          {whitelist.map((addr, i) => (
            <li key={i}><code>{addr}</code></li>
          ))}
        </ul>
      </div>

      <button
        className="mt-2 px-4 py-2 bg-black text-white rounded w-full font-semibold hover:bg-gray-800 transition"
        onClick={handleGenerateProof}
      >
        🔐 Generate Proof
      </button>

      <label className="block mt-6 text-sm font-medium">Paste your proof</label>
      <textarea
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder="0x..."
        rows={4}
        className="w-full p-2 border rounded mt-1 bg-white text-sm font-mono"
      />

      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full font-semibold hover:bg-green-700 transition"
        onClick={handleVerify}
      >
        ✅ On-chain Verification
      </button>

      {proof && status === "idle" && (
        <p className="mt-4 text-blue-600 text-sm">Proof received. Click Submit to verify on-chain.</p>
      )}
      {status === "verifying" && (
        <p className="mt-4 text-gray-500 text-sm">Verifying proof on-chain. Please wait...</p>
      )}
      {status === "success" && (
        <p className="mt-4 text-green-700 text-sm font-semibold">Proof verified successfully.</p>
      )}
      {status === "fail" && (
        <p className="mt-4 text-red-600 text-sm font-semibold">Verification failed. Try again.</p>
      )}
    </div>
  );
}
