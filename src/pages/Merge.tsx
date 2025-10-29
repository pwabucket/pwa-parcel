import { InnerPageLayout } from "../layouts/InnerPageLayout";
import AppIcon from "../assets/icon.svg";
import { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainSetup } from "../components/BlockchainSetup";
import type { Wallet } from "../types";
import { MergeSendersForm } from "../components/MergeSendersForm";
import { Merger } from "../components/Merger";

const Merge = () => {
  const setup = useBlockchain();
  const { isTokenSelected, isSendersSet, configureSenders } = setup;

  return (
    <InnerPageLayout
      title={
        <>
          <img src={AppIcon} alt="App Icon" className="size-6" /> Merge
        </>
      }
      className="flex flex-col gap-2"
    >
      {isSendersSet ? (
        <Merger setup={setup} />
      ) : isTokenSelected ? (
        <MergeSendersForm
          setup={setup}
          onSubmit={(data: { senders: Wallet[] }) =>
            configureSenders(data.senders)
          }
        />
      ) : (
        <BlockchainSetup {...setup} />
      )}
    </InnerPageLayout>
  );
};

export { Merge };
