import React, { useEffect, useState } from "react";
import { groupMembership, verifyProof } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

const whitelist = [
  "0x4Ca47a1126f0A806cDC0AAa2268446A09D6A7CD6",
  "0x0D27320672eB296d39dF4c57e36B6b199091ECB5",
  "0xAd94ba6EDAEb297EFC012429e70467C0725692e3", // My address
  "0x8A50Fb1B8F164AC74fBee2966b9C26C6A985847D",
];

export function StarknetPanel() {
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");
  const [root, setRoot] = useState("");
  const [calldata, setCalldata] = useState();
  
  const [circuitId, setCircuitId] = useState("");

  const chainId = "starknet-devnet";

  const proofData = groupMembership.useProofListener();
  
  useEffect(() => {
    console.log(proofData)
    if (proofData) {
      if(chainId == "starknet-devnet"){
        setProof(proofData.proof);
        setRoot(proofData.publicInputs.root);
        setCircuitId(proofData.circuitId);
        setCalldata(proofData.calldata);
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
      console.log(calldata)
      const ok = await verifyProof(
        { circuitId, chainId, publicInputs: { root }, proof, calldata },
        wallet
      );
      setStatus(ok ? "success" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  return (
    <div className="border border-purple-300 bg-purple-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-purple-900">Starknet Dapp</h2>
      <p className="text-sm text-gray-700 mb-4">
        Prove that your Twitter account has over 100 followers — without revealing your handle.
      </p>

      <button className="mt-4 px-4 py-2 bg-purple-700 text-white rounded w-full" onClick={handleGenerateProof}>
        🔐 Generate Social Proof
      </button>

      <textarea
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder="0x..."
        rows={4}
        className="w-full p-2 border rounded mt-4 bg-white"
      />

      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full" onClick={handleVerify}>
        ✅ On-chain Verification
      </button>

      {proof && status === "idle" && (
        <p className="mt-4 text-purple-600">Proof received. Ready to verify on-chain.</p>
      )}
      {status === "verifying" && (
        <p className="mt-4 text-sm text-purple-600 animate-pulse">Verifying on-chain...</p>
      )}
      {status === "success" && (
        <p className="mt-4 text-sm text-green-700 font-semibold bg-green-100 rounded p-2">Proof verified successfully.</p>
      )}
      {status === "fail" && (
        <p className="mt-4 text-sm text-red-600 font-semibold bg-red-100 rounded p-2">Verification failed.</p>
      )}
    </div>
  );
}
