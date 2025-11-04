import { Dialog } from "radix-ui";
import type { Blockchain } from "../types";
import { PopupDialog } from "./PopupDialog";

interface ConfigFormDialogProps extends Dialog.DialogProps {
  blockchain: Blockchain;
  children: React.ReactNode;
}

const ConfigFormDialog = ({
  children,
  blockchain,
  ...props
}: ConfigFormDialogProps) => {
  return (
    <PopupDialog
      {...props}
      open
      title={blockchain.name || ""}
      icon={blockchain.icon}
      description="Enter the configuration details below"
    >
      {children}
    </PopupDialog>
  );
};

export { ConfigFormDialog };
