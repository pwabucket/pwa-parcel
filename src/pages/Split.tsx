import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import { SplitAmountForm } from "../components/SplitAmountForm";
import { SplitRecipientsForm } from "../components/SplitRecipientsForm";
import { Splitter } from "../components/Splitter";
import { AiOutlineSplitCells } from "react-icons/ai";
import { BlockchainContext } from "../contexts/BlockchainContext";

const Split = () => {
  const setup = useBlockchain();
  const {
    isAmountSet,
    isTokenSelected,
    isRecipientsSet,
    setAmount,
    configureRecipients,
  } = setup;

  return (
    <InnerPageLayout
      title={
        <>
          <AiOutlineSplitCells className="size-6 text-purple-300" />{" "}
          <span className="text-purple-300">Split Tokens</span>
        </>
      }
      className="flex flex-col gap-2"
    >
      <BlockchainContext.Provider value={setup}>
        {isRecipientsSet ? (
          <Splitter setup={setup} />
        ) : isAmountSet ? (
          <SplitRecipientsForm
            setup={setup}
            onSubmit={(data) => configureRecipients(data.addresses)}
          />
        ) : isTokenSelected ? (
          <SplitAmountForm
            setup={setup}
            onSubmit={(data) => setAmount(data.amount)}
          />
        ) : (
          <BlockchainSetup {...setup} />
        )}
      </BlockchainContext.Provider>
    </InnerPageLayout>
  );
};

export { Split };
