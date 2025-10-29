import AppIcon from "../assets/icon.svg";
import type { Token } from "../types";

/** Props for Split Information */
interface SplitInformationProps {
  amount: string;
  token?: Token;
  totalRecipients: number;
}

/** Split Information Component */
const SplitInformation = ({
  amount,
  token,
  totalRecipients,
}: SplitInformationProps) => (
  <p className="text-sm px-4 text-center">
    You are about to split{" "}
    <span className="font-bold">
      <img
        src={token?.icon || AppIcon}
        alt={token?.symbol}
        className="inline-block size-4 rounded-full"
      />{" "}
      {amount} {token?.symbol || "CUSTOM-TOKEN"}
    </span>{" "}
    to <span className="text-purple-400">{totalRecipients}</span> addresses.
  </p>
);

export { SplitInformation };
