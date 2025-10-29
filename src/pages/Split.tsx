import { InnerPageLayout } from "../layouts/InnerPageLayout";
import AppIcon from "../assets/icon.svg";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import { SplitAmountForm } from "../components/SplitAmountForm";
import { SplitRecipientsForm } from "../components/SplitRecipientsForm";
import { Splitter } from "../components/Splitter";

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
          <img src={AppIcon} alt="App Icon" className="size-6" /> Split
        </>
      }
      className="flex flex-col gap-2"
    >
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
    </InnerPageLayout>
  );
};

export { Split };
