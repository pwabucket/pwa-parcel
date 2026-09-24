import { ConfigFormDialog } from "./ConfigFormDialog";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

const ConfigSetup = () => {
  const { showConfigForm, ConfigForm, setConfig, cancelConfigSetup } =
    useBlockChainContext();

  if (!showConfigForm || !ConfigForm) return null;

  return (
    <ConfigFormDialog onOpenChange={cancelConfigSetup}>
      <ConfigForm onSubmit={setConfig} />
    </ConfigFormDialog>
  );
};

export { ConfigSetup };
