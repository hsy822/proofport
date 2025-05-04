import { EthereumPanel } from "../components/EthereumPanel";
import { StarknetPanel } from "../components/StarknetPanel";
import { useState } from "react";

export default function Home() {
  const [selectedChain, setSelectedChain] = useState<"ethereum" | "starknet">("ethereum");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setSelectedChain("ethereum")}
          className={`px-4 py-2 rounded font-semibold ${
            selectedChain === "ethereum"
              ? "bg-black text-white"
              : "bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Ethereum
        </button>
        <button
          onClick={() => setSelectedChain("starknet")}
          className={`px-4 py-2 rounded font-semibold ${
            selectedChain === "starknet"
              ? "bg-purple-800 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Starknet
        </button>
      </div>

      {selectedChain === "ethereum" && <EthereumPanel />}
      {selectedChain === "starknet" && <StarknetPanel />}
    </div>
  );
}
