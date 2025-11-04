import { useBlockChainContext } from "../hooks/useBlockchainContext";

const ParcelProgress = ({ max }: { max: number }) => {
  const { progress } = useBlockChainContext();

  return (
    <div className="w-full h-2 overflow-hidden bg-neutral-800 border border-neutral-700">
      <div
        className="bg-purple-400 h-full transition-all duration-500"
        style={{ width: `${(progress / max) * 100}%` }}
      ></div>
    </div>
  );
};

export { ParcelProgress };
