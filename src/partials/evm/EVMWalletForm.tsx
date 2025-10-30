import { WalletPrivateKeyForm } from "../../components/WalletPrivateKeyForm";
import type { WalletFormProps } from "../../types";

import { Wallet } from "ethers";

function getWalletAddressFromPrivateKey(privateKey: string) {
  if (!privateKey || privateKey.length === 0) return "";
  try {
    const wallet = new Wallet(privateKey);
    return wallet.address;
  } catch {
    return "";
  }
}

const EVMWalletForm = (props: WalletFormProps) => {
  return (
    <WalletPrivateKeyForm
      {...props}
      getWalletAddressFromPrivateKey={getWalletAddressFromPrivateKey}
    />
  );
};

export { EVMWalletForm };
