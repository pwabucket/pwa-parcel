import { HiOutlineCheckCircle, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "../lib/utils";
import type { SplitResult, Token } from "../types";

interface SplitRecipientProps {
  index: number;
  address: string;
  remove?: (index: number) => void;
  amountPerRecipient?: string;
  token?: Token;
  showBalance?: boolean;
  result?: SplitResult;
}

const SplitRecipient = ({
  index,
  address,
  amountPerRecipient,
  token,
  result,
  remove,
  showBalance = true,
}: SplitRecipientProps) => {
  /* Shorten address for display */
  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center justify-between gap-3 p-3 hover:bg-neutral-900/50 transition-colors">
      {/* Index Circle */}
      <span
        className={cn(
          "flex justify-center items-center text-xs font-bold font-mono text-purple-400",
          "size-10 shrink-0 rounded-full border border-purple-400"
        )}
      >
        {index + 1}
      </span>

      {/* Address & Amount Info */}
      <div className="flex flex-col gap-1 grow min-w-0">
        {/* Address */}
        <div className="font-mono text-sm font-bold text-blue-400 truncate">
          {address}
        </div>

        {/* Shortened Address */}
        <div className="font-mono text-xs text-gray-400">
          {shortenAddress(address)}
        </div>

        {/* Amount per recipient */}
        {showBalance && amountPerRecipient && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            {token?.icon && (
              <img
                src={token.icon}
                alt={token.symbol}
                className="size-3 rounded-full"
              />
            )}
            <span className="font-semibold">
              {amountPerRecipient} {token?.symbol || "TOKENS"}
            </span>
          </div>
        )}
      </div>

      {result ? (
        <span className="shrink-0">
          {result.status ? (
            <HiOutlineCheckCircle className="size-6 text-green-400" />
          ) : (
            <HiOutlineXMark className="size-6 text-red-400" />
          )}
        </span>
      ) : null}

      {/* Remove Button */}
      {remove ? (
        <button
          type="button"
          onClick={() => remove(index)}
          className={cn(
            "flex items-center justify-center",
            "hover:bg-red-500/20 hover:text-red-400",
            "size-10 cursor-pointer shrink-0 rounded-full transition-colors"
          )}
          title="Remove recipient"
        >
          <HiOutlineXMark className="size-5" />
        </button>
      ) : null}
    </div>
  );
};

export { SplitRecipient };
