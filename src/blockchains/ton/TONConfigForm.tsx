import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { FormFieldError } from "../../components/FormFieldError";
import { Link } from "react-router";

const schema = yup.object({
  apiKey: yup.string().label("API Key"),
});

interface TONConfigFormProps {
  onSubmit: (data: { apiKey?: string }) => void;
}

const TONConfigForm = ({ onSubmit }: TONConfigFormProps) => {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      apiKey: "",
    },
  });

  const handleFormSubmit = (data: { apiKey?: string }) => {
    console.log("API Key:", data.apiKey);
    onSubmit({
      apiKey: data.apiKey,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Controller
          name="apiKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input {...field} id="apiKey" placeholder="Enter API key" />
              <p className="text-sm text-neutral-400">
                You can get your API key from{" "}
                <Link
                  target="_blank"
                  to="https://t.me/toncenter"
                  className="text-blue-500"
                >
                  @toncenter
                </Link>{" "}
                to avoid rate limits .
              </p>
              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit">Save TON Config</Button>
      </form>
    </FormProvider>
  );
};

export { TONConfigForm };
