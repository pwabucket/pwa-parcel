import { BlockchainPicker } from "../components/BlockchainPicker";
import { TokenPicker } from "../components/TokenPicker";
import { CustomTokenDialog } from "../components/CustomTokenDialog";
import { ConfigFormDialog } from "./ConfigFormDialog";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

const BlockchainSetup = () => {
  const {
    blockchain,
    showConfigForm,
    showCustomTokenForm,
    CustomTokenForm,
    ConfigForm,
    isConfigSet,
    setBlockchain,
    setToken,
    setCustomToken,
    setShowCustomTokenForm,
    setConfig,
    cancelConfigSetup,
  } = useBlockChainContext();
  return (
    <>
      {isConfigSet ? (
        <TokenPicker blockchain={blockchain!} onSelect={setToken} />
      ) : (
        <BlockchainPicker onSelect={setBlockchain} />
      )}

      {/* Show Config Form */}
      {showConfigForm && ConfigForm && (
        <ConfigFormDialog onOpenChange={cancelConfigSetup}>
          <ConfigForm onSubmit={setConfig} />
        </ConfigFormDialog>
      )}

      {/* Custom Token Form */}
      {showCustomTokenForm && (
        <CustomTokenDialog onOpenChange={setShowCustomTokenForm}>
          {CustomTokenForm && <CustomTokenForm onSubmit={setCustomToken} />}
        </CustomTokenDialog>
      )}
    </>
  );
};

export { BlockchainSetup };
