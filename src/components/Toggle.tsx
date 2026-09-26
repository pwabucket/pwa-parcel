import { Switch } from "@base-ui/react/switch";
import { cn } from "../lib/utils";

interface ToggleProps extends Switch.Root.Props {
  label?: React.ReactNode;
}

const Toggle = ({ label, className, ...props }: ToggleProps) => (
  <label
    className={cn(
      "flex items-center justify-between gap-4 px-4 py-2 cursor-pointer",
      props.disabled && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    {label ? <span className="text-sm text-neutral-300">{label}</span> : null}
    <Switch.Root
      {...props}
      className={cn(
        "relative flex shrink-0 w-10 h-6 p-1 rounded-full bg-neutral-700 transition-colors",
        "data-checked:bg-purple-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
      )}
    >
      <Switch.Thumb
        className={cn(
          "size-4 rounded-full bg-white transition-transform",
          "data-checked:translate-x-4"
        )}
      />
    </Switch.Root>
  </label>
);

export { Toggle };
