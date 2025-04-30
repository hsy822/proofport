import { useState } from "react";
import { getProofRequestUrl, verifyProof } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

interface Props {
  chain: "ethereum" | "starknet";
  circuitId: string;
  accent: "yellow" | "purple";
}

export function DappPanel({ chain, circuitId, accent }: Props) {
  const [root, setRoot] = useState("");
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");

  const chainId = chain === "ethereum" ? "11155111" : "starknet-testnet";

  const handleGenerate = () => {
    const url = getProofRequestUrl({
      circuitId,
      chainId,
      publicInputs: { root },
    });
    window.open(url, "_blank");
  };

  const handleVerify = async () => {
    setStatus("verifying");
    try {
      const provider = new JsonRpcProvider("https://rpc.sepolia.org");
      const wallet = Wallet.createRandom().connect(provider);

      const result = await verifyProof(
        { circuitId, chainId, publicInputs: { root }, proof },
        wallet
      );

      setStatus(result ? "success" : "fail");
    } catch (e) {
      console.error(e);
      setStatus("fail");
    }
  };

  const theme = accent === "yellow" ? "border-yellow-300 bg-yellow-50" : "border-purple-300 bg-purple-50";

  return (
    <div className={`border rounded-xl p-6 ${theme}`}>
      <h2 className="text-lg font-bold capitalize">{chain} dapp</h2>
      <p className="text-sm mb-2">Circuit: {circuitId}</p>

      <label className="block mt-4 text-sm font-medium">Merkle Root</label>
      <input
        value={root}
        onChange={(e) => setRoot(e.target.value)}
        placeholder="0x..."
        className="w-full p-2 border rounded mt-1"
      />

      <button className="mt-4 px-4 py-2 bg-black text-white rounded" onClick={handleGenerate}>
        프루프 생성
      </button>

      <label className="block mt-6 text-sm font-medium">Proof</label>
      <textarea
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder="0x..."
        rows={4}
        className="w-full p-2 border rounded mt-1"
      />

      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded" onClick={handleVerify}>
        프루프 제출
      </button>

      {status === "success" && <p className="mt-4 text-green-600">✅ 검증 성공</p>}
      {status === "fail" && <p className="mt-4 text-red-600">❌ 검증 실패</p>}
      {status === "verifying" && <p className="mt-4 text-gray-500">🔄 검증 중...</p>}
    </div>
  );
}
