import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

interface CustomTokenDialogProps extends Dialog.DialogProps {
  children: React.ReactNode;
}

const CustomTokenDialog = ({ children, ...props }: CustomTokenDialogProps) => {
  const { blockchain } = useBlockChainContext();
  return (
    <PopupDialog
      {...props}
      open
      title={blockchain!.name || ""}
      icon={blockchain!.icon}
      description="Enter the custom token details below"
    >
      {children}
    </PopupDialog>
  );
};

export { CustomTokenDialog };
