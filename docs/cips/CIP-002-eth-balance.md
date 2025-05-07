# CIP-002: ETH Balance Threshold (Sample)

## 0. Metadata (Required)

- circuit_id: eth-balance
- version: CIP-002
- description: Proves in zero-knowledge that a user's ETH balance exceeds a given threshold (in wei, Sepolia)
- public_inputs:
  - threshold

---

## 1. Overview

This circuit allows a user to prove, in zero-knowledge, that their ETH balance exceeds a specific threshold.

> **Note**: This circuit is a sample implementation intended for demonstration purposes only.
> It does not include any signature or external commitment mechanism to validate the origin of the `balance` value.
> The value is expected to be retrieved by the browser and used directly for proving.
> This structure is suitable for environments where the proving client is trusted (e.g., browser + open portal code).

---

## 2. Inputs and Outputs

| Name      | Type  | Visibility | Description                                     |
| --------- | ----- | ---------- | ----------------------------------------------- |
| balance   | u64 | private    | ETH balance of the user (retrieved client-side) |
| threshold | u64 | public     | Threshold value (set by the dApp)               |

---

## 3. Circuit Description (Noir)

```rust
fn main(balance: u64, threshold: pub u64) {
    assert(balance >= threshold);
}
```

This circuit checks that the user's balance is greater than or equal to the specified public threshold.

---

## 4. Use Case

This can be used in dApps that require users to prove:

* They hold more than **0.1 ETH** before accessing gated features
* They meet certain financial thresholds without revealing their exact balance

**Proof generation strategy**:

* The portal retrieves the wallet balance via `ethers.getBalance(address)`
* The balance is passed as a private input to the circuit
* Threshold is defined by the dApp and passed as a public input

---

## 5. Limitations

* **No authenticity proof**: The prover could use any arbitrary balance value
* **Safe in demo context**: Since the portal is open source and runs entirely in the browser, this structure is suitable for testnet demos and educational use
