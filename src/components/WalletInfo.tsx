import type { Blockchain, Wallet } from "../types";
import { BlockchainInfo } from "./BlockchainInfo";

interface WalletInfoProps {
  blockchain?: Blockchain;
  wallet?: Wallet;
}

const WalletInfo = ({ blockchain, wallet }: WalletInfoProps) => {
  return (
    <div className="p-2 flex flex-col gap-2 justify-center items-center">
      <BlockchainInfo blockchain={blockchain} />
      <p className="font-mono text-xs text-center text-blue-500 wrap-break-word w-full">
        {wallet?.address}
      </p>
    </div>
  );
};

export { WalletInfo };
