import { BlockchainPicker } from "../components/BlockchainPicker";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import AppIcon from "../assets/icon.svg";
import { TokenPicker } from "../components/TokenPicker";
import { CustomTokenDialog } from "../components/CustomTokenDialog";
import { useBlockchain } from "../hooks/useBlockChain";
import { WalletFormDialog } from "../components/WalletFormDialog";

const Split = () => {
  const {
    blockchain,
    showWalletForm,
    showCustomTokenForm,
    WalletForm,
    CustomTokenForm,
    setBlockchain,
    setToken,
    setWallet,
    setCustomToken,
    setShowCustomTokenForm,
    cancelWalletSetup,
  } = useBlockchain();

  return (
    <InnerPageLayout
      title={
        <>
          <img src={AppIcon} alt="App Icon" className="size-6" /> Split
        </>
      }
      className="flex flex-col gap-2"
    >
      {blockchain ? (
        <TokenPicker tokens={blockchain.tokens} onSelect={setToken} />
      ) : (
        <BlockchainPicker onSelect={setBlockchain} />
      )}

      {/* Wallet Form */}
      {showWalletForm && (
        <WalletFormDialog
          blockchain={blockchain}
          onOpenChange={cancelWalletSetup}
        >
          {WalletForm && <WalletForm onSubmit={setWallet} />}
        </WalletFormDialog>
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
    </InnerPageLayout>
  );
};

export { Split };
