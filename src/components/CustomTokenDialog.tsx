import { Dialog } from "radix-ui";
import type { Blockchain } from "../types";
import { PopupDialog } from "./PopupDialog";

interface CustomTokenDialogProps extends Dialog.DialogProps {
  blockchain: Blockchain;
  children: React.ReactNode;
}

const CustomTokenDialog = ({
  children,
  blockchain,
  ...props
}: CustomTokenDialogProps) => {
  return (
    <PopupDialog
      {...props}
      open
      title={blockchain.name || ""}
      icon={blockchain.icon}
      description="Enter the custom token details below"
    >
      {children}
    </PopupDialog>
  );
};

export { CustomTokenDialog };
