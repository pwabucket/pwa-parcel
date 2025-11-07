import { useState } from "react";
import { BlockchainInfo } from "./BlockchainInfo";
import { Button } from "./Button";
import { AddressesContainer } from "./AddressesContainer";
import { SectionHeading } from "./SectionHeading";
import { MergeInformation } from "./MergeInformation";
import { MergeSender } from "./MergeSender";
import { useMutation } from "@tanstack/react-query";
import { AddressForm } from "./AddressForm";
import { PopupDialog } from "./PopupDialog";
import { ParcelProgress } from "./ParcelProgress";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

const Merger = () => {
  const {
    blockchain,
    mode,
    config,
    receiver,
    token,
    senders,
    resetProgress,
    updateProgress,
    configureReceiver,
    Parcel,
  } = useBlockChainContext();
  const [showReceiverSetup, setShowReceiverSetup] = useState(false);

  const mutation = useMutation({
    mutationKey: ["split", blockchain!.id, token?.address],
    mutationFn: async () => {
      if (!Parcel) {
        throw new Error("Parcel is not defined");
      }

      /* Reset Progress */
      resetProgress();

      const parcelInstance = new Parcel({
        mainnet: import.meta.env.PROD,
        config,
        mode,
      });
      return parcelInstance.merge({
        senders,
        receiver: receiver!,
        token: token!,
        updateProgress,
      });
    },
  });

  const handleReceiverSetup = async ({ address }: { address: string }) => {
    configureReceiver(address);
    setShowReceiverSetup(false);
  };

  const mergeTokens = async () => {
    if (!receiver) {
      setShowReceiverSetup(true);
      return;
    }

    const results = await mutation.mutateAsync();

    console.log("Merge Results:", results);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {/* Blockchain Information */}
        <BlockchainInfo />

        {/* Merge information */}
        <MergeInformation token={token!} totalSenders={senders.length} />

        {receiver && (
          <p className="text-lime-500 break-all font-bold font-mono text-center text-sm">
            Receiver Address: {receiver}
          </p>
        )}

        {/* Progress */}
        {mutation.isPending && <ParcelProgress max={senders.length} />}
      </div>

      {/* Receiver Setup Dialog */}
      {showReceiverSetup && (
        <PopupDialog
          open={showReceiverSetup}
          onOpenChange={setShowReceiverSetup}
          title={blockchain!.name}
          icon={blockchain!.icon}
          description="Enter the receiver's wallet address"
        >
          <AddressForm onSubmit={handleReceiverSetup} />
        </PopupDialog>
      )}

      {/* Merge Button */}
      {mutation.isSuccess ? (
        <p className="text-center text-purple-400 font-display text-2xl">
          Merge completed!
        </p>
      ) : mutation.isError ? (
        <p className="text-center text-red-500">
          Merge failed. Please try again.
        </p>
      ) : (
        <Button disabled={mutation.isPending} onClick={() => mergeTokens()}>
          {mutation.isPending
            ? "Merging..."
            : receiver
            ? "Proceed to Merge"
            : "Setup Address to Receive"}
        </Button>
      )}

      {/* Senders Section Heading */}
      <SectionHeading title={`Senders (${senders.length})`} />

      {/* Senders List */}
      <AddressesContainer>
        {senders.map((sender, index) => (
          <MergeSender
            key={index}
            index={index}
            address={sender.address}
            result={mutation.data ? mutation.data[index] : undefined}
          />
        ))}
      </AddressesContainer>
    </div>
  );
};

export { Merger };
