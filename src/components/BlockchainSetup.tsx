import type { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainPicker } from "../components/BlockchainPicker";
import { TokenPicker } from "../components/TokenPicker";
import { CustomTokenDialog } from "../components/CustomTokenDialog";
import { ConfigFormDialog } from "./ConfigFormDialog";

type BlockchainSetupProps = ReturnType<typeof useBlockchain>;
const BlockchainSetup = ({
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
}: BlockchainSetupProps) => {
  return (
    <>
      {isConfigSet ? (
        <TokenPicker blockchain={blockchain!} onSelect={setToken} />
      ) : (
        <BlockchainPicker onSelect={setBlockchain} />
      )}

      {/* Show Config Form */}
      {showConfigForm && ConfigForm && (
        <ConfigFormDialog blockchain={blockchain}>
          <ConfigForm onSubmit={setConfig} />
        </ConfigFormDialog>
      )}

      {/* Custom Token Form */}
      {showCustomTokenForm && (
        <CustomTokenDialog
          onOpenChange={setShowCustomTokenForm}
          blockchain={blockchain}
        >
          {CustomTokenForm && <CustomTokenForm onSubmit={setCustomToken} />}
        </CustomTokenDialog>
      )}
    </>
  );
};

export { BlockchainSetup };
