import { DappPanel } from "../components/DappPanel";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-100">
      <DappPanel chain="ethereum" circuitId="group-membership" accent="yellow" />
      <DappPanel chain="starknet" circuitId="follower-over-100" accent="purple" />
    </div>
  );
}
