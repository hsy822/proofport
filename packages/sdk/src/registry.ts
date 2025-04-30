import { Registry, RegistryEntry } from "./types.js";

const REGISTRY_URL = "https://raw.githubusercontent.com/hsy822/proofport/main/packages/registry/verifier_registry.json";

let cachedRegistry: Registry | null = null;

/**
 * Fetches the verifier registry from a remote source.
 */
export async function getRegistry(): Promise<Registry> {
  if (cachedRegistry) return cachedRegistry;

  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch registry: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  cachedRegistry = json;
  return json;
}

/**
 * Gets a registry entry for a specific circuit.
 */
export async function getRegistryEntry(circuitId: string): Promise<RegistryEntry> {
  const registry = await getRegistry();
  const entry = registry[circuitId];
  if (!entry) throw new Error(`Registry entry not found for circuit: ${circuitId}`);
  return entry;
}