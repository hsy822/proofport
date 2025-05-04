import { poseidon2 } from "poseidon-lite"
const MAX_DEPTH = 4;

function hash2(a: bigint, b: bigint): bigint {
  return poseidon2([a, b]);
}

function toHex(n: bigint): string {
  return "0x" + n.toString(16).padStart(64, "0");
}

export function createMerkleRoot(leaves: string[]): string {
  const hashedLeaves = leaves.map((v) => poseidon2([BigInt(v), 0n]));
  const maxLeaves = 2 ** MAX_DEPTH;

  // pad leaves with zeros if needed
  while (hashedLeaves.length < maxLeaves) hashedLeaves.push(0n);
  const tree: bigint[][] = [hashedLeaves];

  for (let d = 0; d < MAX_DEPTH; d++) {
    const prev = tree[d];
    const next: bigint[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(hash2(prev[i], prev[i + 1]));
    }
    tree.push(next);
  }

  return toHex(tree[MAX_DEPTH][0]);
}