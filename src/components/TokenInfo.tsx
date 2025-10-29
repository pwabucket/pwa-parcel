import type { Token } from "../types";
import AppIcon from "../assets/icon.svg";

interface TokenInfoProps {
  token: Token;
}

const TokenInfo = ({ token }: TokenInfoProps) => {
  return (
    <div className="p-2 flex gap-2 items-center bg-neutral-950 border border-neutral-900 rounded-lg">
      <img
        src={token?.icon || AppIcon}
        alt=""
        className="size-10 shrink-0 rounded-full"
      />
      <div className="grow min-w-0">
        <h2 className="font-bold">{`${token.name} (${token.symbol || ""})`}</h2>
        <p className="font-mono text-xs text-lime-500 wrap-break-word">
          {token?.address}
        </p>
      </div>
    </div>
  );
};

export { TokenInfo };
