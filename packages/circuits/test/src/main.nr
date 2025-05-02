use dep::std::merkle::compute_merkle_root;


fn main(leaf: Field, index: Field, hashpath: [Field; 8], root: pub Field) {
    println(leaf);
    println(index);

    for i in 0..8 {
        println(hashpath[i]);
    }

    let computed = compute_merkle_root(leaf, index, hashpath);
    println(computed);
    println(root);

    assert(computed == root);
}