export class MerkleTree {
    public leaves: bigint[];
    public depth: number;
    public zero: bigint = BigInt(0);
  
    constructor(leaves: bigint[], depth = 20) {
      this.leaves = leaves;
      this.depth = depth;
    }
  
    getRoot(): bigint {
      let level = this.leaves;
      while (level.length < 2 ** this.depth) {
        level.push(this.zero);
      }
  
      for (let d = 0; d < this.depth; d++) {
        const next: bigint[] = [];
        for (let i = 0; i < level.length; i += 2) {
          next.push(poseidon2([level[i], level[i + 1] || this.zero]));
        }
        level = next;
      }
  
      return level[0];
    }
  }
  