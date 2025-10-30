import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "./Button";
import { Label } from "./Label";
import { FormFieldError } from "./FormFieldError";
import type { WalletFormProps } from "../types";
import { TextArea } from "./TextArea";
import { useEffect, useState } from "react";

const schema = yup.object({
  privateKey: yup.string().required("Private key is required"),
});

interface WalletPrivateKeyFormProps extends WalletFormProps {
  getWalletAddressFromPrivateKey: (
    privateKey: string
  ) => Promise<string> | string;
}

const WalletPrivateKeyForm = ({
  onSubmit,
  getWalletAddressFromPrivateKey,
}: WalletPrivateKeyFormProps) => {
  const [address, setAddress] = useState("");
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      privateKey: "",
    },
  });

  const handleFormSubmit = async (data: { privateKey: string }) => {
    console.log("Wallet Private Key:", data.privateKey);
    onSubmit({
      address: await getWalletAddressFromPrivateKey(data.privateKey),
      privateKey: data.privateKey,
    });
  };

  const privateKey = form.watch("privateKey");

  useEffect(() => {
    (async () => {
      const address = await getWalletAddressFromPrivateKey(privateKey);
      setAddress(address);
    })();
  }, [privateKey, getWalletAddressFromPrivateKey]);

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
                {address}
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

export { WalletPrivateKeyForm };
