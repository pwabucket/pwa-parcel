import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

interface ConfigFormDialogProps extends Dialog.DialogProps {
  children: React.ReactNode;
}

const ConfigFormDialog = ({ children, ...props }: ConfigFormDialogProps) => {
  const { blockchain } = useBlockChainContext();

  return (
    <PopupDialog
      {...props}
      open
      title={blockchain!.name || ""}
      icon={blockchain!.icon}
      description="Enter the configuration details below"
    >
      {children}
    </PopupDialog>
  );
};

export { ConfigFormDialog };
