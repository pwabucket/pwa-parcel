import AppIcon from "../assets/icon.svg";
import { useBlockchain } from "../hooks/useBlockChain";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Button } from "../components/Button";
import { BlockchainInfo } from "./BlockchainInfo";
import { SectionHeading } from "./SectionHeading";
import { PopupDialog } from "./PopupDialog";
import { useState } from "react";
import { AddressForm } from "./AddressForm";
import { HiOutlineXMark } from "react-icons/hi2";
import { FormFieldError } from "./FormFieldError";
import { cn } from "../lib/utils";
import { MdGroupAdd } from "react-icons/md";
import type { Token } from "../types";

const schema = yup.object({
  addresses: yup
    .array()
    .of(yup.string().required().label("Address"))
    .min(1, "At least one address is required")
    .required("Addresses are required"),
});

interface SplitRecepientProps {
  index: number;
  address: string;
  remove: (index: number) => void;
  amountPerRecipient?: string;
  token?: Token;
  showBalance?: boolean;
}

const SplitRecepient = ({
  index,
  address,
  amountPerRecipient,
  token,
  remove,
  showBalance = true,
}: SplitRecepientProps) => {
  /* Shorten address for display */
  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center justify-between gap-3 p-3 hover:bg-neutral-900/50 transition-colors">
      {/* Index Circle */}
      <span
        className={cn(
          "flex justify-center items-center text-xs font-bold font-mono text-purple-400",
          "size-10 shrink-0 rounded-full border border-purple-400"
        )}
      >
        {index + 1}
      </span>

      {/* Address & Amount Info */}
      <div className="flex flex-col gap-1 grow min-w-0">
        {/* Address */}
        <div className="font-mono text-sm font-bold text-blue-400 truncate">
          {address}
        </div>

        {/* Shortened Address */}
        <div className="font-mono text-xs text-gray-400">
          {shortenAddress(address)}
        </div>

        {/* Amount per recipient */}
        {showBalance && amountPerRecipient && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            {token?.icon && (
              <img src={token.icon} alt={token.symbol} className="size-3" />
            )}
            <span className="font-semibold">
              {amountPerRecipient} {token?.symbol || "TOKENS"}
            </span>
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => remove(index)}
        className={cn(
          "flex items-center justify-center",
          "hover:bg-red-500/20 hover:text-red-400",
          "size-10 cursor-pointer shrink-0 rounded-full transition-colors"
        )}
        title="Remove recipient"
      >
        <HiOutlineXMark className="size-5" />
      </button>
    </div>
  );
};

/** Props for Split Information */
interface SplitInformationProps {
  amount: string;
  token?: Token;
  totalRecipients: number;
}

/** Split Information Component */
const SplitInformation = ({
  amount,
  token,
  totalRecipients,
}: SplitInformationProps) => (
  <p className="text-sm px-4 text-center">
    You are about to split{" "}
    <span className="font-bold">
      <img
        src={token?.icon || AppIcon}
        alt={token?.symbol}
        className="inline-block size-4"
      />{" "}
      {amount} {token?.symbol || "CUSTOM-TOKEN"}
    </span>{" "}
    to <span className="text-purple-400">{totalRecipients}</span> addresses.
  </p>
);

type FormData = {
  addresses: string[];
};

interface SplitRecepientsFormProps {
  setup: ReturnType<typeof useBlockchain>;
  onSubmit: (data: { addresses: string[] }) => void;
}

const SplitRecepientsForm = ({ setup, onSubmit }: SplitRecepientsFormProps) => {
  const [showAddRecipientDialog, setShowAddRecipientDialog] = useState(false);
  const { amount, token, blockchain } = setup;
  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      addresses: [],
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
          {/* Heading */}
          <SectionHeading title="Recepients" />

          {/* Addresses */}
          <Controller
            name="addresses"
            render={({ field, fieldState }) => (
              <>
                <div
                  id="addresses-container"
                  className="overflow-auto max-h-96"
                >
                  <div className="flex flex-col divide-y divide-neutral-900">
                    {field.value.length === 0 ? (
                      <p className="text-sm italic text-center">
                        No recipients added yet.
                      </p>
                    ) : (
                      field.value.map((address: string, index: number) => (
                        <SplitRecepient
                          key={index}
                          index={index}
                          address={address}
                          remove={remove}
                          amountPerRecipient={amountPerRecipient}
                          token={token || undefined}
                        />
                      ))
                    )}
                  </div>
                </div>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          {/* Submit Button */}
          <Button type="submit">Proceed</Button>
        </form>
      </FormProvider>
    </>
  );
};

export { SplitRecepientsForm };
