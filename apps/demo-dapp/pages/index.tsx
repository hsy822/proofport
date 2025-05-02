import { EthereumPanel } from "../components/EthereumPanel";
import { StarknetPanel } from "../components/StarknetPanel";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-100">
      <EthereumPanel />
      <StarknetPanel />
    </div>
  );
}