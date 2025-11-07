import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

interface WalletFormDialogProps extends Dialog.DialogProps {
  children: React.ReactNode;
}

const WalletFormDialog = ({ children, ...props }: WalletFormDialogProps) => {
  const { blockchain } = useBlockChainContext();
  return (
    <PopupDialog
      open
      {...props}
      title={blockchain!.name || ""}
      icon={blockchain!.icon}
      description="Enter the wallet details below"
    >
      {children}
    </PopupDialog>
  );
};

export { WalletFormDialog };
