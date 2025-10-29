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
import { PopupDialog } from "./PopupDialog";
import { useState } from "react";
import { AddressForm } from "./AddressForm";
import { FormFieldError } from "./FormFieldError";
import { MdGroupAdd } from "react-icons/md";
import { SplitInformation } from "./SplitInformation";
import { SplitRecipient } from "./SplitRecipient";
import { RecipientsContainer } from "./RecipientsContainer";

const schema = yup.object({
  addresses: yup
    .array()
    .of(yup.string().required().label("Address"))
    .min(1, "At least one address is required")
    .required("Addresses are required"),
});

type FormData = {
  addresses: string[];
};

interface SplitRecipientsFormProps {
  setup: ReturnType<typeof useBlockchain>;
  onSubmit: (data: { addresses: string[] }) => void;
}

const SplitRecipientsForm = ({ setup, onSubmit }: SplitRecipientsFormProps) => {
  const [showAddRecipientDialog, setShowAddRecipientDialog] = useState(false);
  const { amount, token, blockchain, recipients } = setup;
  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      addresses: recipients,
    },
  });

  /* Field Array for Addresses */
  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "addresses" as never,
  });

  /* Calculate amount per recipient */
  const amountPerRecipient =
    fields.length > 0
      ? (parseFloat(amount || "0") / fields.length).toFixed(8)
      : "0";

  /* Form Submission */
  const handleFormSubmit = (data: { addresses: string[] }) => {
    if (data.addresses.length === 0) return;

    console.log("Split Recepients:", data.addresses);
    onSubmit({ addresses: data.addresses });
  };

  /* Add Recipient */
  const addRecipient = (data: { address: string }) => {
    prepend(data.address);
    setShowAddRecipientDialog(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Blockchain Information */}
        <BlockchainInfo blockchain={blockchain} />

        {/* Split information */}
        <SplitInformation
          amount={amount!}
          token={token!}
          totalRecipients={fields.length}
        />
      </div>

      {/* Add Recipient Dialog */}
      <PopupDialog
        open={showAddRecipientDialog}
        onOpenChange={setShowAddRecipientDialog}
        title={blockchain.name}
        icon={blockchain.icon}
        description="Enter the recipient's wallet address"
      >
        <AddressForm onSubmit={addRecipient} />
      </PopupDialog>

      {/* Form */}
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Submit Button */}
          <Button type="submit">Proceed</Button>

          {/* Heading */}
          <SectionHeading title={`Recipients (${fields.length})`} />

          {/* Add Recipient Button */}
          <Button
            variant={"secondary"}
            type="button"
            onClick={() => setShowAddRecipientDialog(true)}
            className="rounded-full mx-auto text-sm"
          >
            <MdGroupAdd className="size-6" />
            Add Recipient
          </Button>

          {/* Addresses */}
          <Controller
            name="addresses"
            render={({ field, fieldState }) => (
              <>
                <RecipientsContainer>
                  {field.value.length === 0 ? (
                    <p className="text-sm italic text-center">
                      No recipients added yet.
                    </p>
                  ) : (
                    field.value.map((address: string, index: number) => (
                      <SplitRecipient
                        key={index}
                        index={index}
                        address={address}
                        remove={remove}
                        amountPerRecipient={amountPerRecipient}
                        token={token || undefined}
                      />
                    ))
                  )}
                </RecipientsContainer>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />
        </form>
      </FormProvider>
    </>
  );
};

export { SplitRecipientsForm };
