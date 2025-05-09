# Proofport

**ZK Proof Infrastructure for Developers and dApps**  
Standardized circuits. Pre-deployed verifiers. Plug-and-play SDK.  

---

## Overview

**Proofport** simplifies integration of zero-knowledge proofs into decentralized applications.  
Instead of reinventing the wheel, developers can use standardized, audited Noir circuits with pre-deployed verifiers and a browser-native proof generation portal.

![screen](https://github.com/user-attachments/assets/425822fb-884f-4461-96a3-438250ab3e6b)

---

## Key Features

- **Standard Circuits (CIP-based)** — Reusable Noir circuits for common proof cases  
- **Pre-deployed Verifiers** — Solidity & Cairo verifiers on EVM and Starknet  
- **Simple SDK** — `verifyProof()` and `useProofListener()` abstractions  
- **OAuth-style Portal** — UX-focused proof generation without exposing identity

---

## Example Circuits

| Circuit ID        | Description                            | Inputs             |
|-------------------|----------------------------------------|--------------------|
| `group-membership`| Prove inclusion in a Merkle tree       | `root`             |
| `eth-balance`     | Prove wallet holds ETH above threshold | `threshold`        |

---

## Monorepo Structure

```bash
proofport/
├── apps/
│   └── demo-dapp/       # Example dApp using the SDK
├── packages/
│   ├── sdk/             # Proofport SDK
│   ├── circuits/        # Noir circuits (group-membership, eth-balance)
│   ├── registry/        # Verifier registry JSON
└── operator/            # Backend for verifier deployment
````

---

## Usage (for dApp developers)

```ts
import { verifyProof, getRegistry, ethBalance } from "@proofport/sdk";

// 1. Request a proof
ethBalance.openEthBalanceProofRequest(chainId, threshold, sessionNonce, Date.now());

// 2. Listen for result
const proofData = ethBalance.useProofListenerWithValidation({ expectedNonce, allowedOrigin });

// 3. Verify on-chain
const ok = await verifyProof({
  circuitId: "eth-balance",
  chainId,
  publicInputs: { threshold },
  proof: proofData.proof
}, signer);
```

---

## Environment

| Tool                | Installed Version  | Note |
|:--------------------|:-------------------|:-----|
| Node.js             | v20.13.1            | ✅  |
| Python              | 3.10.17             | ✅  |
| Nargo (Noir CLI)    | 1.0.0-beta.3        | ✅  |
| Garaga              | 0.17.0              | ✅  |
| Sncast              | 0.41.0              | ✅  |
| Scarb               | 2.11.4 (Cairo: 2.11.4) | ✅  |
| Starknet Devnet     | 0.3.0                | ✅  |
| Anvil (EVM local)   | 1.0.0-stable         | ✅  |
| asdf                | v0.16.7             | ✅  |
| barretenberg        | v0.85.0             | ✅  |
---

## Security

* **Nonce + Timestamp**: Replay & spoofing protection
* **Origin Restriction**: Controlled `postMessage` validation
* **SDK Validation**: Proofs are verified before exposure to dApp

---

## Authors & Credits

Developed by **Team Proofport** for NoirHack 2025.

---

## License

MIT


