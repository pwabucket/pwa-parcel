import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";
import { Button } from "./Button";

interface PopupDialogProps extends Dialog.DialogProps {
  title: string;
  icon: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

const PopupDialog = ({
  title,
  icon,
  description,
  children,
  ...props
}: PopupDialogProps) => {
  return (
    <Dialog.Root {...props}>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 overflow-y-auto grid place-items-center px-4 py-10 bg-black/60 z-50"
        )}
      >
        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "bg-neutral-950 p-6 w-full max-w-md",
            "border border-neutral-900",
            "flex flex-col gap-4 min-w-0"
          )}
        >
          <div className="flex flex-col gap-2">
            <Dialog.Title className="flex items-center justify-center font-bold gap-2">
              <img
                src={icon}
                alt={title?.toString()}
                className="inline-block size-6"
              />
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-center text-sm text-neutral-400">
              {description}
            </Dialog.Description>
          </div>

          {children}

          <Dialog.Close asChild>
            <Button variant="outline">Close</Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Root>
  );
};

export { PopupDialog };
