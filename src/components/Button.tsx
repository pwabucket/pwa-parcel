import { Slot } from "radix-ui";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  [
    "cursor-pointer flex gap-2 items-center justify-center",
    "disabled:opacity-50",
    "px-4 py-3",
  ],
  {
    variants: {
      variant: {
        default: ["bg-purple-400 text-black", "hover:bg-purple-300"],
        secondary: ["bg-green-400 text-black", "hover:bg-green-400"],
        tertiary: ["bg-blue-400 text-black", "hover:bg-blue-400"],
        outline: [
          "bg-transparent border border-neutral-900",
          "hover:bg-neutral-900 hover:border-neutral-800",
          "outline-0 focus:border-purple-500",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** Button Component */
const Button = ({ asChild, variant, className, ...props }: ButtonProps) => {
  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      {...props}
      className={cn(buttonVariants({ variant, className }))}
    />
  );
};

export { Button };
