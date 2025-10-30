import { useState } from "react";
import type { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainInfo } from "./BlockchainInfo";
import { Button } from "./Button";
import { AddressesContainer } from "./AddressesContainer";
import { SectionHeading } from "./SectionHeading";
import { MergeInformation } from "./MergeInformation";
import { MergeSender } from "./MergeSender";
import { useMutation } from "@tanstack/react-query";
import { AddressForm } from "./AddressForm";
import { PopupDialog } from "./PopupDialog";

interface MergerProps {
  setup: ReturnType<typeof useBlockchain>;
}

const Merger = ({ setup }: MergerProps) => {
  const { blockchain, receiver, token, senders, configureReceiver, Parcel } =
    setup;
  const [showReceiverSetup, setShowReceiverSetup] = useState(false);

  const mutation = useMutation({
    mutationKey: ["split", blockchain.id, token?.address],
    mutationFn: async () => {
      if (!Parcel) {
        throw new Error("Parcel is not defined");
      }
      const parcelInstance = new Parcel({ mainnet: import.meta.env.PROD });
      return parcelInstance.merge({
        senders,
        receiver: receiver!,
        token: token!,
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
        <BlockchainInfo blockchain={blockchain} />

        {/* Merge information */}
        <MergeInformation token={token!} totalSenders={senders.length} />

        {receiver && (
          <p className="text-lime-500 break-all font-bold font-mono text-center text-sm">
            Receiver Address: {receiver}
          </p>
        )}
      </div>

      {/* Receiver Setup Dialog */}
      {showReceiverSetup && (
        <PopupDialog
          open={showReceiverSetup}
          onOpenChange={setShowReceiverSetup}
          title={blockchain.name}
          icon={blockchain.icon}
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
