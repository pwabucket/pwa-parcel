import { InnerPageLayout } from "../layouts/InnerPageLayout";
import AppIcon from "../assets/icon.svg";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import { SplitAmountForm } from "../components/SplitAmountForm";
import { SplitRecepientsForm } from "../components/SplitRecepientsForm";

const Split = () => {
  const setup = useBlockchain();
  const { isAmountSet, isTokenSelected, setAmount } = setup;

  return (
    <InnerPageLayout
      title={
        <>
          <img src={AppIcon} alt="App Icon" className="size-6" /> Split
        </>
      }
      className="flex flex-col gap-2"
    >
      {isAmountSet ? (
        <SplitRecepientsForm
          setup={setup}
          onSubmit={(data) => {
            console.log("Split Data:", data);
          }}
        />
      ) : isTokenSelected ? (
        <>
          <SplitAmountForm
            setup={setup}
            onSubmit={(data) => setAmount(data.amount)}
          />
        </>
      ) : (
        <BlockchainSetup {...setup} />
      )}
    </InnerPageLayout>
  );
};

export { Split };
