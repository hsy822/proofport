# Proofport SDK Documentation

**Proofport SDK** provides an easy interface to integrate Noir-based zero-knowledge proofs into web applications.
It enables in-browser proof generation via the Proofport Portal and seamless on-chain verification through a unified SDK.

---

## Key Features

### 1. `getProofRequestUrl(params: ProofRequestParams): string`

Generates a URL that directs the user to the Proofport Portal for proof generation.

```ts
const url = getProofRequestUrl({
  circuitId: "group-membership",
  chainId: "sepolia",
  publicInputs: { root: "0xabc..." },
  metadata: {
    nonce: "session123",
    issued_at: Date.now()
  }
});
```

---

### 2. `useProofListenerWithValidation(options): ProofData | null`

Safely listens for proof messages via `window.postMessage`. The SDK validates:

* Matching `nonce`
* Message freshness based on `issued_at`
* Origin check (optional `allowedOrigin`)

```ts
const data = useProofListenerWithValidation({
  expectedNonce: "session123",
  maxAgeMs: 300000,
  allowedOrigin: "http://localhost:3001"
});
```

---

### 3. `verifyProof(params: ProofVerifyParams, signerOrProvider): Promise<boolean>`

Verifies a ZK proof on-chain using deployed verifiers (EVM or Starknet).
Chain type is auto-detected.

```ts
const result = await verifyProof({
  circuitId: "eth-balance",
  chainId: "sepolia",
  publicInputs: { threshold: "0x05" },
  proof
}, signer);
```

---

### 4. Proof Request Helpers

#### `openGroupMembershipProofRequest(...)`

#### `openEthBalanceProofRequest(...)`

Opens a popup window for proof generation using pre-defined circuit IDs.
Internally calls `getProofRequestUrl` and launches a browser window with `window.open()`.

---

### 5. Merkle Utility Functions

#### `createMerkleRoot(leaves: string[]): string`

Calculates a Merkle root for use with group-membership proofs.

#### `flattenFieldsAsArray(fields: string[]): Uint8Array`

Converts hex string fields into a single flattened byte array.

---

## Type Definitions

### `ProofRequestParams`

```ts
type ProofRequestParams = GroupMembershipProofRequest | EthBalanceProofRequest;
```

**GroupMembershipProofRequest**

```ts
{
  circuitId: "group-membership";
  chainId: string;
  publicInputs: { root: string };
  metadata?: {
    tree?: string;
    nonce?: string;
    issued_at?: number;
  };
}
```

**EthBalanceProofRequest**

```ts
{
  circuitId: "eth-balance";
  chainId: string;
  publicInputs: { threshold: string };
  metadata?: {
    nonce?: string;
    issued_at?: number;
  };
}
```

---

### `ProofVerifyParams`

```ts
type ProofVerifyParams = GroupMembershipProofVerify | EthBalanceProofVerify;
```

---

### `RegistryEntry` Format

```ts
interface RegistryEntry {
  circuit_id: string;
  version: string;
  description: string;
  public_inputs: string[];
  metadata: {
    noir_version: string;
    hash: number;
    abi: { parameters: NoirParameter[]; ... };
    bytecode: string;
  };
  chains: {
    [chainId: string]: {
      evm_address?: string;
      starknet_address?: string;
      deployed_at: string;
    };
  };
}
```

---

## Supported Circuits

| Circuit ID       | Description                           |
| ---------------- | ------------------------------------- |
| group-membership | Merkle Tree inclusion proof (CIP-001) |
| eth-balance      | ETH balance threshold check (CIP-002) |

---

## Security Design

* Nonce-based session binding (prevents replay)
* `issued_at` timestamp to enforce expiration window
* `origin` check to prevent cross-site message injection
* All proofs are validated in the SDK before being passed to the dApp

---

## Notes

* This SDK is designed for use in local or testnet environments.
* Verifiers are currently deployed to **Anvil (EVM)** and **Starknet Devnet** only.
* **The bundled circuits are for demonstration and testing purposes.**
* **They have not undergone formal security auditing and should not be used in production environments until reviewed.**

---
