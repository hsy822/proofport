import React, { useEffect, useState } from "react";
import { groupMembership, verifyProof } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

const whitelist = [
  "0x4Ca47a1126f0A806cDC0AAa2268446A09D6A7CD6",
  "0x0D27320672eB296d39dF4c57e36B6b199091ECB5",
  "0xAd94ba6EDAEb297EFC012429e70467C0725692e3", // My address
  "0x8A50Fb1B8F164AC74fBee2966b9C26C6A985847D",
];

export function EthereumPanel() {
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");
  const [root, setRoot] = useState("");
  const [circuitId, setCircuitId] = useState("");

  const chainId = "anvil";

  const proofData = groupMembership.useProofListener();

  useEffect(() => {
    if (proofData) {
      if(chainId == "anvil"){
        setProof(proofData.proof);
        setRoot(proofData.publicInputs.root);
        setCircuitId(proofData.circuitId);
      }
    }
  }, [proofData]);

  const handleGenerateProof = async () => {
    groupMembership.openGroupMembershipProofRequest(chainId, whitelist);
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
      <h2 className="text-xl font-bold text-yellow-900 mb-2">Ethereum DApp</h2>
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
        On-chain Verification
      </button>

      {proof && status === "idle" && (
        <p className="mt-4 text-blue-600 text-sm">Proof received. Click Submit to verify on-chain.</p>
      )}
      {status === "verifying" && (
        <p className="mt-4 text-sm text-yellow-600 animate-pulse">Verifying proof on-chain. Please wait...</p>
      )}
      {status === "success" && (
        <p className="mt-4 text-sm text-green-700 font-semibold bg-green-100 rounded p-2">Proof verified successfully.</p>
      )}
      {status === "fail" && (
        <p className="mt-4 text-sm text-red-600 font-semibold bg-red-100 rounded p-2">Verification failed. Try again.</p>
      )}
    </div>
  );
}
