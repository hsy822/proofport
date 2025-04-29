# CIP-001: Group Membership Proof

## 0. Metadata (Required)

_This section is **mandatory**. Every CIP must include a Metadata block with the following fields:_

- circuit_id: group-membership
- version: CIP-001
- description: Proof of Merkle group membership inclusion
- public_inputs:
  - root

<!-- End of Metadata -->

## 1. Overview

- A circuit that enables a user to prove membership within a specific Merkle Tree Root without revealing private information.
- Allows users to prove their affiliation without disclosing their identity.
- Can be applied to Private DAOs, Private Access Control Systems, Private Event Attendees, and similar use cases.

## 2. Motivation

- Enables maintaining the whitelist off-chain while proving membership on-chain.
- Allows for dynamic list management while ensuring secure and cost-efficient verification.

## 3. Inputs and Outputs

| Name | Type | Visibility | Description |
|:---|:---|:---|:---|
| message | [Field; 62] | private | The message used to construct the Merkle Leaf |
| index | Field | private | The index of the Leaf within the Merkle Tree |
| hashpath | [Field; 40] | private | The Merkle Proof path |
| root | Field | public | The Merkle Tree Root to be verified against |

- The message is hashed to create a leaf, and the Merkle Proof is used to verify the connection to the given root.
- The only public input is the Merkle Tree Root.

## 4. Circuit Description

```rust
fn main(message : [Field; 62], index : Field, hashpath : [Field; 40], root : Field) {
    let leaf = std::hash::hash_to_field(message.as_slice());
    let merkle_root = std::merkle::compute_merkle_root(leaf, index, hashpath);
    assert(merkle_root == root);
}
```
 
- message is hashed into a leaf.
- Using index and hashpath, the Merkle root is recomputed.
- The circuit asserts that the recomputed root matches the provided public root.