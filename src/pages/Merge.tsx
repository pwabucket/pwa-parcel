import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import type { Wallet } from "../types";
import { MergeSendersForm } from "../components/MergeSendersForm";
import { Merger } from "../components/Merger";
import { AiOutlineMerge } from "react-icons/ai";
import { BlockchainContext } from "../contexts/BlockchainContext";
import { MergeAmountForm } from "../components/MergeAmountForm";

const Merge = () => {
  const setup = useBlockchain();
  const {
    isTokenSelected,
    isMergeAmountSet,
    isSendersSet,
    configureSenders,
    setAmount,
  } = setup;

  return (
    <InnerPageLayout
      title={
        <>
          <AiOutlineMerge className="size-6 text-green-300" />{" "}
          <span className="text-green-300">Merge Tokens</span>
        </>
      }
      className="flex flex-col gap-2"
      showBackButton={!setup.fromOpener}
    >
      <BlockchainContext.Provider value={setup}>
        {isSendersSet ? (
          <Merger />
        ) : isMergeAmountSet ? (
          <MergeSendersForm
            onSubmit={(data: { senders: Wallet[] }) =>
              configureSenders(data.senders)
            }
          />
        ) : isTokenSelected ? (
          <MergeAmountForm onSubmit={(data) => setAmount(data.amount || "")} />
        ) : (
          <BlockchainSetup />
        )}
      </BlockchainContext.Provider>
    </InnerPageLayout>
  );
};

export { Merge };
