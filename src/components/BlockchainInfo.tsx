import { cn } from "../lib/utils";
import type { Blockchain } from "../types";
import AppIcon from "../assets/icon.svg";

const BlockchainInfo = ({ blockchain }: { blockchain?: Blockchain }) => (
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
    {blockchain?.name || "Select a Blockchain"}
  </h3>
);

export { BlockchainInfo };
