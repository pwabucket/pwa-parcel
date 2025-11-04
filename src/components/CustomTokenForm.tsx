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

const CustomTokenForm = ({
  onSubmit,
  getTokenDetails,
}: CustomTokenFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });

  const handleFormSubmit = async (data: { address: string }) => {
    console.log("Custom Token Address:", data.address);
    const details = getTokenDetails
      ? await getTokenDetails(data.address)
      : null;
    if (details) {
      onSubmit({
        id: data.address,
        name: details.name || "Custom Token",
        symbol: details.symbol || "",
        decimals: details.decimals || 0,
        address: data.address,
        icon: details.icon || "",
      });
      return;
    }

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
                disabled={form.formState.isSubmitting}
              />

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Save Custom Token"}
        </Button>
      </form>
    </FormProvider>
  );
};

export { CustomTokenForm };
