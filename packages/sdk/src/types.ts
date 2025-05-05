export interface GroupMembershipProofRequest {
  circuitId: "group-membership";
  chainId: string;
  publicInputs: {
    root: string;
  };
  metadata?: {
    tree?: string;
    leaf: string;
    index: string;
    hashpath: string; // stringified JSON array
  };
}

export interface EthBalanceProofRequest {
  circuitId: "eth-balance";
  chainId: string;
  publicInputs: {
    threshold: string;
  };
  metadata?: undefined;
}

// export interface TwitterFollowersProofRequest { ... }

export type ProofRequestParams =
  | GroupMembershipProofRequest
  | EthBalanceProofRequest;

export interface GroupMembershipProofVerify {
  circuitId: "group-membership";
  chainId: string;
  publicInputs: {
    root: string;
  };
  proof: string;
  calldata?: any;
}

export interface EthBalanceProofVerify {
  circuitId: "eth-balance";
  chainId: string;
  publicInputs: {
    threshold: string;
  };
  proof: string;
  calldata?: any;
}

export type ProofVerifyParams = GroupMembershipProofVerify | EthBalanceProofVerify;

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
      starknet_address?: string;
      deployed_at: string;
    };
  };
}

export interface Registry {
  [circuitId: string]: RegistryEntry;
}
