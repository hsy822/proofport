global DEPTH: u32 = 3;
fn main(
    index: pub Field,
    root: pub Field,
    leaf: Field,
    merkle_path: [Field; DEPTH],
) {
    let computed = std::merkle::compute_merkle_root(leaf, index, merkle_path);
    assert(computed == root);
    assert(leaf == 0); 
}

#[test]
fn test_main() {

    let index = 1;
    let leaf = 0;

    let merkle_path = [
        123456789,
        987654321,
        111213141,
    ];

    let root = std::merkle::compute_merkle_root(leaf, index, merkle_path);

    main(index, root, leaf, merkle_path);
}