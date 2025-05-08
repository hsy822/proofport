import React, { useEffect, useState } from "react";
import { groupMembership, ethBalance, verifyProof, getRegistry } from "@proofport/sdk";
import { JsonRpcProvider, Wallet } from "ethers";

export function StarknetPanel() {
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "fail">("idle");
  const [root, setRoot] = useState("");
  const [calldata, setCalldata] = useState();
  const [circuitId, setCircuitId] = useState("group-membership");
  const [registryDescription, setRegistryDescription] = useState("");
  const [verifierAddress, setVerifierAddress] = useState("");
  const [sessionNonce, setSessionNonce] = useState(() => crypto.randomUUID());

  const [whitelist, setWhitelist] = useState<string[]>([
      "0x076cFe339144246C87F3E7dEacFc23CAfF9283Da9182ab58D05A410800c491Ea",
      "0x02433E38ad721690Bfa5B2b05df05480819efa4Ef676F0971b5B10dB0dd1C91A",
      "0x02A9f6C3206B56647c363a825890F5f088e1AfBc6b2EfA1516764eE58405b7ee",
  ]);
  const [newAddress, setNewAddress] = useState("");
  const [thresholdInput, setThresholdInput] = useState("1000000000000000000"); // 1 ETH
  const [thresholdProofValue, setThresholdProofValue] = useState<string | null>(null);
    
  const chainId = "starknet-devnet";
  const allowedOrigin = "htts://zkdev.net";
  // const allowedOrigin = "http://localhost:3001";
  const maxAgeMs = 300_000;
  const networkUrl = 'https://7faf-54-180-132-187.ngrok-free.app';
  // const networkUrl = "http://localhost:5050";

  // Load circuit metadata from registry
  useEffect(() => {
    (async () => {
      try {
        const registry = await getRegistry(); // SDK function to fetch registry
        const entry = registry[circuitId];
        if (entry) {
          setRegistryDescription(entry.description);
          const verifier = registry[circuitId]?.chains?.[chainId];
          if (verifier) {
            setVerifierAddress(verifier.evm_address || verifier.starknet_address || "");
          }
        }
      } catch (err) {
        console.warn("Failed to load registry info:", err);
      }
    })();
  }, [circuitId, chainId]);

  const proofDataForGroupMembership = groupMembership.useProofListenerWithValidation({
    expectedNonce: sessionNonce,
    maxAgeMs,
    allowedOrigin,
  });

  useEffect(() => {
    if (!proofDataForGroupMembership) return;

    setProof(proofDataForGroupMembership.proof);
    setCircuitId(proofDataForGroupMembership.circuitId);
    setCalldata(proofDataForGroupMembership.calldata);
    setRoot(proofDataForGroupMembership.publicInputs.root);
    
  }, [proofDataForGroupMembership]);
  
  const proofDataForEthBalance = ethBalance.useProofListenerWithValidation({
    expectedNonce: sessionNonce,
    maxAgeMs,
    allowedOrigin,
  });

  useEffect(() => {
    if (!proofDataForEthBalance) return;
    setProof(proofDataForEthBalance.proof);
    setCircuitId(proofDataForEthBalance.circuitId);
    setCalldata(proofDataForEthBalance.calldata);
    setThresholdProofValue(proofDataForEthBalance.publicInputs.threshold);
  }, [proofDataForEthBalance]);

  const handleGenerateProof = async () => {
    // Dispatch proof request depending on selected circuit
    if (circuitId === "group-membership") {
      groupMembership.openGroupMembershipProofRequest(
        chainId, 
        whitelist, 
        sessionNonce,
        Date.now() // issuedAt
      );
    } else if (circuitId === "eth-balance") {
      ethBalance.openEthBalanceProofRequest(
        chainId, 
        thresholdInput,
        sessionNonce,
        Date.now() // issuedAt
      );  
    }
  };

  const handleVerify = async () => {
    setStatus("verifying");
    try {
      const provider = new JsonRpcProvider(networkUrl);
      const wallet = Wallet.createRandom().connect(provider);
      
      let ok = false;

      // Dynamically choose proof inputs depending on circuit
      switch (circuitId) {
        case "group-membership":
          ok = await verifyProof(
            {
              circuitId,
              chainId,
              publicInputs: { root },
              proof,
              calldata
            },
            wallet
          );
          break;

        case "eth-balance":
          ok = await verifyProof(
            {
              circuitId,
              chainId,
              publicInputs: { threshold: toBytes32Hex(thresholdProofValue ?? thresholdInput) },
              proof,
              calldata
            },
            wallet
          );
          break;

        default:
          throw new Error("Unsupported circuit");
      }
      setStatus(ok ? "success" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  const handleAddAddress = () => {
    const addr = newAddress.trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(addr)) {
      alert("Please enter a valid Starknet address.");
      return;
    }
    if (whitelist.includes(addr)) {
      alert("Address is already in the allowlist.");
      return;
    }
    setWhitelist((prev) => [...prev, addr]);
    setNewAddress("");
  };

  return (
    <div className="max-w-2xl mx-auto border border-purple-300 bg-purple-50 rounded-xl p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Circuit</label>
        <select
          value={circuitId}
          onChange={(e) => setCircuitId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="group-membership">Group Membership</option>
          <option value="eth-balance">ETH Balance</option>
        </select>
      </div>
      
      {/* Circuit-specific UI */}
      {circuitId === "group-membership" && (
        <>
          <h2 className="text-xl font-semibold text-purple-900">Starknet Dapp: {circuitId}</h2>
          <p className="text-sm text-gray-700 mb-4">{registryDescription}</p>
          <div className="mb-4 text-sm text-gray-700">
            <p className="font-medium">Allowlist:</p>
            <ul className="ml-4 list-disc text-xs">
              {whitelist.map((addr, i) => (
                <li key={i}><code>{addr}</code></li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Add your address to the allowlist
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Copy your Ethereum address and paste it below to test group membership.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleAddAddress}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}

      {circuitId === "eth-balance" && (
        <>
          <h2 className="text-xl font-semibold text-purple-900">Starknet Dapp</h2>
          <p className="text-sm text-gray-700 mb-4">{registryDescription}</p>
          <label className="block text-sm mb-1 font-medium">ETH Threshold (in wei)</label>
          <input
            type="text"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
        </>
      )}
      <button
        className="mt-2 px-4 py-2 bg-purple-700 text-white rounded w-full font-semibold hover:bg-gray-800 transition"
        onClick={handleGenerateProof}
      >
        Generate Proof
      </button>

      <label className="block mt-6 text-sm font-medium">Proof</label>
      <textarea
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder="0x..."
        rows={4}
        className="w-full p-2 border rounded mt-4 bg-white text-sm font-mono"
        disabled
      />

      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full font-semibold hover:bg-green-700 transition"
        onClick={handleVerify}
      >
        On-chain Verification
      </button>

      {verifierAddress && (
        <div className="mt-6 text-xs text-gray-600">
          <p>
            Verifier Contract: {verifierAddress}
          </p>
        </div>
      )}

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

function toBytes32Hex(n: string | bigint): string {
  return "0x" + BigInt(n).toString(16).padStart(64, "0");
}