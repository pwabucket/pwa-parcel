import AppIcon from "../assets/icon.svg";
import { useBlockchain } from "../hooks/useBlockChain";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Label } from "../components/Label";
import { Input } from "../components/Input";
import { FormFieldError } from "../components/FormFieldError";
import { Button } from "../components/Button";
import { BlockchainInfo } from "./BlockchainInfo";

const schema = yup.object({
  amount: yup.string().required().label("Amount"),
});

interface SplitAmountFormProps {
  setup: ReturnType<typeof useBlockchain>;
  onSubmit: (data: { amount: string }) => void;
}

const SplitAmountForm = ({ setup, onSubmit }: SplitAmountFormProps) => {
  const { token, blockchain } = setup;
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: "",
    },
  });

  const handleFormSubmit = (data: { amount: string }) => {
    console.log("Split Amount:", data.amount);
    onSubmit({ amount: data.amount });
  };

  return (
    <>
      <BlockchainInfo blockchain={blockchain} />

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
                  to Split
                </Label>
                <Input {...field} placeholder="Enter amount" />
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          <Button type="submit">Next</Button>
        </form>
      </FormProvider>
    </>
  );
};

export { SplitAmountForm };
