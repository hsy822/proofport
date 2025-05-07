# CIP-001: Group Membership Proof (binary_merkle_root based)

## 0. Metadata (Required)

- circuit_id: group-membership
- version: CIP-001
- description: Proves Merkle inclusion using binary_merkle_root helper
- public_inputs:
  - root

<!-- End of Metadata -->

---

## 1. Overview

> This circuit uses the `binary_merkle_root` implementation from the [privacy-scaling-explorations/zk-kit.noir](https://github.com/privacy-scaling-explorations/zk-kit.noir) repository.

> This circuit verifies, in zero-knowledge, that a user-provided leaf is included in a Merkle tree defined by a given root.  
It uses the proven and audited `binary_merkle_root` helper function for compatibility and correctness.

---

## 2. Inputs and Outputs

| Name                | Type                    | Visibility | Description                            |
|---------------------|-------------------------|------------|----------------------------------------|
| identity_commitment | Field                   | private    | Poseidon hash of the user identity     |
| merkle_proof_length | u32                     | private    | Actual depth of the proof              |
| merkle_proof_indices| [u1; 4]         | private    | Index bits (left/right path)           |
| merkle_proof_siblings| [Field; 4]     | private    | Merkle sibling hashes                  |
| root                | Field                   | public     | Merkle root to verify against          |

---

## 3. Circuit Description (Noir)

```rust
use binary_merkle_root::binary_merkle_root;
use std::hash::poseidon::bn254::hash_2 as poseidon2;

fn main(
    identity_commitment: Field,
    merkle_proof_length: u32,
    merkle_proof_indices: [u1; 4],
    merkle_proof_siblings: [Field; 4],
    root: pub Field,
) {
    let computed_root = binary_merkle_root(poseidon2, identity_commitment, merkle_proof_length, merkle_proof_indices, merkle_proof_siblings);
    assert(computed_root == root);
}