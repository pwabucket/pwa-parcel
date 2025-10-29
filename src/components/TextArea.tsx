import { cn } from "../lib/utils";

const TextArea = (props: React.ComponentProps<"textarea">) => {
  return (
    <textarea
      {...props}
      className={cn(
        "px-4 py-3 border border-neutral-900",
        "focus:outline-none focus:ring-2 focus:ring-purple-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
};

export { TextArea };
