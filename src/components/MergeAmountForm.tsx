import AppIcon from "../assets/icon.svg";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Label } from "../components/Label";
import { Input } from "../components/Input";
import { FormFieldError } from "../components/FormFieldError";
import { Button } from "../components/Button";
import { BlockchainInfo } from "./BlockchainInfo";
import { useBlockChainContext } from "../hooks/useBlockchainContext";
import { Toggle } from "./Toggle";

const schema = yup.object({
  retain: yup.boolean().default(false),
  amount: yup
    .string()
    .label("Amount")
    .when("retain", {
      is: true,
      then: (schema) =>
        schema
          .required("Enter the amount to keep in each wallet")
          .test(
            "positive",
            "Amount must be greater than 0",
            (value) => parseFloat(value) > 0
          ),
    }),
});

interface MergeAmountFormData {
  amount?: string;
  retain?: boolean;
}

interface MergeAmountFormProps {
  onSubmit: (data: MergeAmountFormData) => void;
}

const MergeAmountForm = ({ onSubmit }: MergeAmountFormProps) => {
  const { token } = useBlockChainContext();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: "",
      retain: false,
    },
  });

  const retain = form.watch("retain");

  const handleFormSubmit = (data: MergeAmountFormData) => {
    console.log("Merge Amount:", data.amount, "Retain:", data.retain);
    onSubmit({ amount: data.amount, retain: data.retain });
  };

  return (
    <>
      <BlockchainInfo />

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <Label htmlFor="amount">
                  <img
                    src={token?.icon || AppIcon}
                    alt="Token Icon"
                    className="inline-block size-4 rounded-full mr-2"
                  />
                  Amount of{" "}
                  <span className="font-bold">
                    ({token!.symbol || "CUSTOM-TOKEN"})
                  </span>{" "}
                  {retain ? "to keep in each wallet" : "to merge from each wallet"}
                </Label>
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  placeholder={
                    retain ? "Enter amount to keep" : "Enter amount (Optional)"
                  }
                />
                <p className="text-center text-sm text-neutral-400">
                  {retain
                    ? "Everything above this amount will be sent"
                    : "Leave this blank to merge all available tokens"}
                </p>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          <Controller
            name="retain"
            control={form.control}
            render={({ field }) => (
              <Toggle
                label="Retain this amount in each wallet (send the rest)"
                name={field.name}
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked)}
                inputRef={field.ref}
              />
            )}
          />

          <Button type="submit">Next</Button>
        </form>
      </FormProvider>
    </>
  );
};

export { MergeAmountForm };
