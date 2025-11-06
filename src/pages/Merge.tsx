import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import type { Wallet } from "../types";
import { MergeSendersForm } from "../components/MergeSendersForm";
import { Merger } from "../components/Merger";
import { AiOutlineMerge } from "react-icons/ai";
import { BlockchainContext } from "../contexts/BlockchainContext";

const Merge = () => {
  const setup = useBlockchain();
  const { isTokenSelected, isSendersSet, configureSenders } = setup;

  return (
    <InnerPageLayout
      title={
        <>
          <AiOutlineMerge className="size-6 text-green-300" />{" "}
          <span className="text-green-300">Merge Tokens</span>
        </>
      }
      className="flex flex-col gap-2"
    >
      <BlockchainContext.Provider value={setup}>
        {isSendersSet ? (
          <Merger />
        ) : isTokenSelected ? (
          <MergeSendersForm
            onSubmit={(data: { senders: Wallet[] }) =>
              configureSenders(data.senders)
            }
          />
        ) : (
          <BlockchainSetup />
        )}
      </BlockchainContext.Provider>
    </InnerPageLayout>
  );
};

export { Merge };
