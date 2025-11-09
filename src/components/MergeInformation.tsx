import AppIcon from "../assets/icon.svg";
import type { Token } from "../types";

/** Props for Merge Information */
interface MergeInformationProps {
  amount?: string;
  token?: Token;
  totalSenders: number;
}

/** Merge Information Component */
const MergeInformation = ({
  token,
  amount,
  totalSenders,
}: MergeInformationProps) => (
  <p className="text-sm px-4 text-center">
    Merge{" "}
    <span className="font-bold text-lime-300">
      {amount ? `${amount}` : "all available"}
    </span>{" "}
    <span className="font-bold">
      <img
        src={token?.icon || AppIcon}
        alt={token?.symbol}
        className="inline-block size-4 rounded-full"
      />{" "}
      {token?.symbol || "CUSTOM-TOKEN"}
    </span>{" "}
    from <span className="text-purple-400">{totalSenders}</span> wallets.
  </p>
);

export { MergeInformation };
