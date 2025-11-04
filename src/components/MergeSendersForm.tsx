import { useBlockchain } from "../hooks/useBlockChain";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Button } from "./Button";
import { BlockchainInfo } from "./BlockchainInfo";
import { SectionHeading } from "./SectionHeading";
import { useState } from "react";
import { FormFieldError } from "./FormFieldError";
import { MdGroupAdd } from "react-icons/md";
import { MergeSender } from "./MergeSender";
import { AddressesContainer } from "./AddressesContainer";
import { MergeInformation } from "./MergeInformation";
import { WalletFormDialog } from "./WalletFormDialog";
import type { Wallet } from "../types";
import { cn } from "../lib/utils";

const schema = yup.object({
  senders: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          address: yup.string().required().label("Address"),
          privateKey: yup.string().label("Private Key"),
          phrase: yup.string().label("Phrase"),
        })
        .required()
        .label("Sender")
    )
    .min(1, "At least one sender is required")
    .required("Senders are required"),
});

type FormData = {
  senders: Wallet[];
};

interface MergeSendersFormProps {
  setup: ReturnType<typeof useBlockchain>;
  onSubmit: (data: { senders: Wallet[] }) => void;
}

const MergeSendersForm = ({ setup, onSubmit }: MergeSendersFormProps) => {
  const [showAddSenderDialog, setShowAddSenderDialog] = useState(false);
  const { mode, token, blockchain, senders, WalletForm, setMode } = setup;
  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      senders,
    },
  });

  /* Field Array for Senders */
  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "senders" as never,
  });

  /* Form Submission */
  const handleFormSubmit = (data: { senders: Wallet[] }) => {
    if (data.senders.length === 0) return;

    console.log("Split Recepients:", data.senders);
    onSubmit({ senders: data.senders });
  };

  /* Add Sender */
  const addSender = (wallet: Wallet) => {
    prepend(wallet);
    setShowAddSenderDialog(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Blockchain Information */}
        <BlockchainInfo blockchain={blockchain} />

        {/* Merge information */}
        <MergeInformation token={token!} totalSenders={fields.length} />
      </div>

      {/* Add Sender Dialog */}
      <WalletFormDialog
        blockchain={blockchain}
        open={showAddSenderDialog}
        onOpenChange={setShowAddSenderDialog}
      >
        {WalletForm && <WalletForm onSubmit={addSender} />}
      </WalletFormDialog>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={"outline"}
          className={cn(mode === "single" && "text-purple-300 font-bold")}
          onClick={() => setMode("single")}
        >
          Single Mode
        </Button>
        <Button
          variant={"outline"}
          className={cn(mode === "batch" && "text-purple-300 font-bold")}
          onClick={() => setMode("batch")}
        >
          Batch Mode
        </Button>
      </div>

      {/* Form */}
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Submit Button */}
          <Button type="submit">Proceed</Button>

          {/* Heading */}
          <SectionHeading title={`Senders (${fields.length})`} />

          {/* Add Sender Button */}
          <Button
            variant={"secondary"}
            type="button"
            onClick={() => setShowAddSenderDialog(true)}
            className="rounded-full mx-auto text-sm"
          >
            <MdGroupAdd className="size-6" />
            Add Sender
          </Button>

          {/* Senders */}
          <Controller
            name="senders"
            render={({ field, fieldState }) => (
              <>
                <AddressesContainer>
                  {field.value.length === 0 ? (
                    <p className="text-sm italic text-center">
                      No recipients added yet.
                    </p>
                  ) : (
                    field.value.map((sender: Wallet, index: number) => (
                      <MergeSender
                        key={index}
                        index={index}
                        address={sender.address}
                        remove={remove}
                      />
                    ))
                  )}
                </AddressesContainer>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />
        </form>
      </FormProvider>
    </>
  );
};

export { MergeSendersForm };
