import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "./Input";
import { Button } from "./Button";
import { Label } from "./Label";
import { FormFieldError } from "./FormFieldError";
import type { CustomTokenFormProps } from "../types";

const schema = yup.object({
  address: yup.string().required("Token address is required"),
});

const CustomTokenForm = ({ onSubmit }: CustomTokenFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });

  const handleFormSubmit = (data: { address: string }) => {
    console.log("Custom Token Address:", data.address);
    onSubmit({
      id: data.address,
      name: "Custom Token",
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

        <Button type="submit">Save Custom Token</Button>
      </form>
    </FormProvider>
  );
};

export { CustomTokenForm };
