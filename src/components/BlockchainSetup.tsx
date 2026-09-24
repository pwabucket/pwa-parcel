import { BlockchainPicker } from "../components/BlockchainPicker";
import { TokenPicker } from "../components/TokenPicker";
import { CustomTokenDialog } from "../components/CustomTokenDialog";
import { ConfigSetup } from "./ConfigSetup";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

const BlockchainSetup = () => {
  const {
    group,
    blockchain,
    showCustomTokenForm,
    CustomTokenForm,
    isConfigSet,
    setBlockchain,
    setToken,
    setCustomToken,
    setShowCustomTokenForm,
  } = useBlockChainContext();
  return (
    <>
      {isConfigSet ? (
        <TokenPicker blockchain={blockchain!} onSelect={setToken} />
      ) : (
        <BlockchainPicker group={group} onSelect={setBlockchain} />
      )}

      {/* Show Config Form */}
      <ConfigSetup />

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
