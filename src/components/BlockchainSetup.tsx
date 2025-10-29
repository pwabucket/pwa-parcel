import type { useBlockchain } from "../hooks/useBlockChain";
import { BlockchainPicker } from "../components/BlockchainPicker";
import { TokenPicker } from "../components/TokenPicker";
import { CustomTokenDialog } from "../components/CustomTokenDialog";

type BlockchainSetupProps = ReturnType<typeof useBlockchain>;
const BlockchainSetup = ({
  blockchain,
  showCustomTokenForm,
  CustomTokenForm,
  setBlockchain,
  setToken,
  setCustomToken,
  setShowCustomTokenForm,
}: BlockchainSetupProps) => {
  return (
    <>
      {blockchain ? (
        <TokenPicker blockchain={blockchain!} onSelect={setToken} />
      ) : (
        <BlockchainPicker onSelect={setBlockchain} />
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
