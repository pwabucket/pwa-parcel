import { cn } from "../lib/utils";
import AppIcon from "../assets/icon.svg";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

const BlockchainInfo = () => {
  const { blockchain } = useBlockChainContext();

  return (
    <h3
      className={cn(
        "flex flex-col gap-2 items-center justify-center",
        "text-center text-purple-300 text-xl font-extralight"
      )}
    >
      <img
        src={blockchain?.icon || AppIcon}
        alt=""
        className="size-16 shrink-0"
      />
      {blockchain?.name || "Parcel"}
    </h3>
  );
};

export { BlockchainInfo };
