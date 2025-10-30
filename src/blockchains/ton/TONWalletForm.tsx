import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { FormFieldError } from "../../components/FormFieldError";
import type { WalletFormProps } from "../../types";
import { TextArea } from "../../components/TextArea";
import { Select } from "../../components/Select";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { useEffect, useState } from "react";

async function getWalletAddressFromPhrase(mnemonic: string, version: number) {
  if (!mnemonic || mnemonic.length === 0) return "";
  try {
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));

    const contract =
      version === 4
        ? WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
          })
        : WalletContractV5R1.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
          });
    return contract.address.toString({
      bounceable: false,
      testOnly: import.meta.env.DEV,
    });
  } catch (e) {
    console.error("Error getting wallet address:", e);
    return "";
  }
}

const schema = yup.object({
  mnemonic: yup.string().required().label("Mnemonic phrase"),
  version: yup
    .number()
    .oneOf([4, 5])
    .default(5)
    .required()
    .label("TON Wallet Version"),
});

const TONWalletForm = ({ onSubmit }: WalletFormProps) => {
  const [address, setAddress] = useState("");
  const form = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      mnemonic: "",
      version: 5,
    },
  });

  const handleFormSubmit = async (data: {
    mnemonic: string;
    version: number;
  }) => {
    console.log("TON Wallet Phrase:", data.mnemonic);
    console.log("TON Wallet Version:", data.version);

    onSubmit({
      address: await getWalletAddressFromPhrase(data.mnemonic, data.version),
      mnemonic: data.mnemonic,
      version: data.version,
    });
  };

  const version = form.watch("version");
  const mnemonic = form.watch("mnemonic");

  useEffect(() => {
    getWalletAddressFromPhrase(mnemonic, version).then(setAddress);
  }, [version, mnemonic]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Controller
          name="mnemonic"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="mnemonic">Private Key</Label>
              <TextArea
                {...field}
                id="mnemonic"
                placeholder="Enter mnemonic phrase"
                rows={4}
              />

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Controller
          name="version"
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="version">TON Wallet Version</Label>
              <Select
                {...field}
                id="version"
                onChange={(ev) => field.onChange(Number(ev.target.value))}
              >
                <Select.Option value={5}>Version 5</Select.Option>
                <Select.Option value={4}>Version 4</Select.Option>
              </Select>
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

export { TONWalletForm };
