import { useState } from "react";
import type { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainInfo } from "./BlockchainInfo";
import { Button } from "./Button";
import { RecipientsContainer } from "./RecipientsContainer";
import { SectionHeading } from "./SectionHeading";
import { SplitInformation } from "./SplitInformation";
import { SplitRecipient } from "./SplitRecipient";
import { WalletFormDialog } from "./WalletFormDialog";
import type { Wallet } from "../types";
import { useMutation } from "@tanstack/react-query";

interface SplitterProps {
  setup: ReturnType<typeof useBlockchain>;
}

const Splitter = ({ setup }: SplitterProps) => {
  const {
    blockchain,
    amount,
    token,
    recipients,
    wallet,
    configureWallet,
    WalletForm,
    Parcel,
  } = setup;
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const amountPerRecipient =
    recipients.length > 0
      ? (parseFloat(amount || "0") / recipients.length).toFixed(8)
      : "0";

  const mutation = useMutation({
    mutationKey: ["split", blockchain.id, token?.address],
    mutationFn: async () => {
      if (!Parcel) {
        throw new Error("Parcel is not defined");
      }
      const parcelInstance = new Parcel();
      return parcelInstance.split({
        wallet: setup.wallet!,
        addresses: recipients,
        token: token!,
        amount: amount!,
      });
    },
  });

  const handleWalletSetupSubmit = async (wallet: Wallet) => {
    configureWallet(wallet);
    setShowWalletSetup(false);
  };

  const splitTokens = async () => {
    if (!wallet) {
      setShowWalletSetup(true);
      return;
    }

    const results = await mutation.mutateAsync();

    console.log("Split Results:", results);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {/* Blockchain Information */}
        <BlockchainInfo blockchain={blockchain} />

        {/* Split information */}
        <SplitInformation
          amount={amount!}
          token={token!}
          totalRecipients={recipients.length}
        />
      </div>

      {/* Wallet Setup Dialog */}
      {showWalletSetup && WalletForm && (
        <WalletFormDialog
          blockchain={blockchain}
          onOpenChange={setShowWalletSetup}
        >
          <WalletForm onSubmit={handleWalletSetupSubmit} />
        </WalletFormDialog>
      )}

      {/* Split Button */}
      {mutation.isSuccess ? (
        <p className="text-center text-green-500">Split successful!</p>
      ) : mutation.isError ? (
        <p className="text-center text-red-500">
          Split failed. Please try again.
        </p>
      ) : (
        <Button disabled={mutation.isPending} onClick={() => splitTokens()}>
          {mutation.isPending
            ? "Splitting..."
            : wallet
            ? "Proceed to Split"
            : "Setup Wallet to Split"}
        </Button>
      )}

      {/* Recipients Section Heading */}
      <SectionHeading title={`Recipients (${recipients.length})`} />

      {/* Recipients List */}
      <RecipientsContainer>
        {recipients.map((recipient, index) => (
          <SplitRecipient
            key={index}
            index={index}
            address={recipient}
            amountPerRecipient={amountPerRecipient}
            token={token!}
            result={mutation.data ? mutation.data[index] : undefined}
          />
        ))}
      </RecipientsContainer>
    </div>
  );
};

export { Splitter };
