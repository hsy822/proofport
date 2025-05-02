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