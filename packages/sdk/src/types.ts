
export interface ProofRequestParams {
  circuitId: string;
  chainId: string;
  publicInputs: Record<string, string>;
  metadata?: {
    tree?: string; // base64 encoded Merkle tree JSON
  };
}

export interface ProofVerifyParams {
  circuitId: string;
  chainId: string;
  publicInputs: Record<string, string>;
  proof: string;
}

export interface RegistryEntry {
  circuit_id: string;
  version: string;
  description: string;
  public_inputs: string[];
  chains: {
    [chainId: string]: {
      evm_address?: string;
      starknet_class_hash?: string;
      deployed_at: string;
    };
};
}

export interface Registry {
  [circuitId: string]: RegistryEntry;
}
