import { Dialog } from "radix-ui";
import type { Blockchain } from "../types";
import { PopupDialog } from "./PopupDialog";

interface WalletFormDialogProps extends Dialog.DialogProps {
  blockchain: Blockchain;
  children: React.ReactNode;
}

const WalletFormDialog = ({
  children,
  blockchain,
  ...props
}: WalletFormDialogProps) => {
  return (
    <PopupDialog
      open
      {...props}
      title={blockchain.name || ""}
      icon={blockchain.icon}
      description="Enter the wallet details below"
    >
      {children}
    </PopupDialog>
  );
};

export { WalletFormDialog };
