import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "./Button";
import { Label } from "./Label";
import { Input } from "./Input";
import { FormFieldError } from "./FormFieldError";

const schema = yup.object({
  address: yup.string().required().label("Wallet Address"),
});

interface AddressFormProps {
  onSubmit: (data: { address: string }) => void;
}

const AddressForm = ({ onSubmit }: AddressFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });

  const handleFormSubmit = (data: { address: string }) => {
    console.log("Wallet Address:", data.address);
    onSubmit({
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
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                {...field}
                id="address"
                placeholder="Enter wallet address"
              />

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </FormProvider>
  );
};

export { AddressForm };
