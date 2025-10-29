import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { FormFieldError } from "../../components/FormFieldError";
import type { WalletFormProps } from "../../types";
import { TextArea } from "../../components/TextArea";
import { Wallet } from "ethers";

function getWalletAddressFromPrivateKey(privateKey: string) {
  if (!privateKey || privateKey.length === 0) return "";
  try {
    const wallet = new Wallet(privateKey);
    return wallet.address;
  } catch {
    return "";
  }
}

const schema = yup.object({
  privateKey: yup.string().required("Private key is required"),
});

const EVMWalletForm = ({ onSubmit }: WalletFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      privateKey: "",
    },
  });

  const handleFormSubmit = (data: { privateKey: string }) => {
    console.log("EVM Wallet Private Key:", data.privateKey);
    onSubmit({
      address: getWalletAddressFromPrivateKey(data.privateKey),
      privateKey: data.privateKey,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Controller
          name="privateKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="privateKey">Private Key</Label>
              <TextArea
                {...field}
                id="privateKey"
                placeholder="Enter private key"
                rows={4}
              />
              <p className="text-sm px-4 text-blue-500 text-center font-mono wrap-break-word">
                {getWalletAddressFromPrivateKey(field.value)}
              </p>

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </FormProvider>
  );
};

export { EVMWalletForm };
