import { BarretenbergSync } from "@aztec/bb.js";

// 바레텐베르크 해시 인스턴스 싱글톤 관리
let bb: BarretenbergSync | undefined;

async function getBB() {
  if (!bb) {
    bb = await BarretenbergSync.initSingleton();
  }
  return bb;
}

// BigInt를 필드 hex 문자열로 변환
function toHex(n: bigint): string {
  return "0x" + n.toString(16).padStart(64, "0");
}

/**
 * Create Merkle root and serialized tree from a list of string values
 * All values will be poseidon2-hashed, and zero-padded to 2^depth
 */
export async function createMerkleArtifacts(leaves: string[], depth = 20): Promise<{
  root: string;
  serializedTree: string;
}> {
  const api = await getBB();

  // 1. Leaf hash 처리
  const leafHashes: bigint[] = [];
  for (const leaf of leaves) {
    const input = BigInt(leaf);
    const hash = await api.poseidon2Hash([input]);
    leafHashes.push(hash);
  }

  // 2. Zero padding
  const zero = BigInt(0);
  let level: bigint[] = [...leafHashes];
  const maxLeaves = 2 ** depth;
  while (level.length < maxLeaves) {
    level.push(zero);
  }

  // 3. Merkle Tree 계산
  const treeLevels: bigint[][] = [level];
  for (let d = 0; d < depth; d++) {
    const prev = treeLevels[d];
    const next: bigint[] = [];

    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1] ?? zero;
      const hash = await api.poseidon2Hash([left, right]);
      next.push(hash);
    }

    treeLevels.push(next);
  }

  const root = treeLevels[depth][0];

  // 4. 직렬화 결과 생성
  const serializedTree = JSON.stringify({
    leaves: leafHashes.map(toHex),
    depth,
  });

  return {
    root: toHex(root),
    serializedTree,
  };
}
