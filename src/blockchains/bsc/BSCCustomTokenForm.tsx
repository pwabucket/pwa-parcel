import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { FormFieldError } from "../../components/FormFieldError";
import type { CustomTokenFormProps } from "../../types";

const schema = yup.object({
  address: yup.string().required("Token address is required"),
});

const BSCCustomTokenForm = ({ onSubmit }: CustomTokenFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });

  const handleFormSubmit = (data: { address: string }) => {
    console.log("Custom BSC Token Address:", data.address);
    onSubmit({
      id: data.address,
      name: "Custom BSC Token",
      address: data.address,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Controller
          name="address"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="address">Token Address</Label>
              <Input
                {...field}
                id="address"
                placeholder="Enter token address"
              />

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit">Add Custom Token</Button>
      </form>
    </FormProvider>
  );
};

export { BSCCustomTokenForm };
