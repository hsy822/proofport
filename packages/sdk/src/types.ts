export interface ProofRequestParams {
  circuitId: string;
  chainId: string;
  publicInputs: Record<string, string>;
  metadata?: {
    tree?: string;         // optional
    leaf?: string;         // required now
    index?: string;        // required
    hashpath?: string;     // stringified JSON array
  };
}

export interface ProofVerifyParams {
  circuitId: string;
  chainId: string;
  publicInputs: Record<string, string>;
  proof: string;
}

export interface NoirType {
  kind: "field" | "integer" | "array";
  width?: number;
  sign?: "unsigned" | "signed";
  length?: number;
  type?: NoirType; // for arrays
}

export interface NoirParameter {
  name: string;
  type: NoirType;
  visibility: "public" | "private";
}

export interface RegistryEntry {
  circuit_id: string;
  version: string;
  description: string;
  public_inputs: string[];
  metadata: {
    noir_version: string;
    hash: number;
    abi: {
      parameters: NoirParameter[];
      return_type: null;
      error_types: Record<string, unknown>;
    };
    bytecode: string;
  };
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