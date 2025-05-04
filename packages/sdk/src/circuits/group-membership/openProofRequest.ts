
import { getProofRequestUrl } from "../../proofport.js";
import { createMerkleRoot } from "./createMerkleArtifacts.js";

export function openGroupMembershipProofRequest(chainId: string, whitelist: string[]) {
  const root = createMerkleRoot(whitelist);
  const url = getProofRequestUrl({
    circuitId: "group-membership",
    chainId,
    publicInputs: { root }
  });

  const win = window.open(url, "_blank");
  if (win) win.name = JSON.stringify({ whitelist });
}