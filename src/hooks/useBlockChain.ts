import { useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router";
import { blockchains } from "../resources/blockchains";
import type { Token, Wallet } from "../types";
import { useNavigateBack } from "./useNavigateBack";

interface BlockchainLocationState {
  blockchain: string;
  token?: Token;
  amount?: string;
  recipients?: string[];
  senders?: string[];
  wallet?: string;
}

const useBlockchain = () => {
  const navigateBack = useNavigateBack();
  const navigate = useNavigate();
  const location: Location<BlockchainLocationState> = useLocation();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [receiver, setReceiver] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [senders, setSenders] = useState<Wallet[]>([]);

  const token: Token | null = location.state?.token || null;
  const amount: string | null = location.state?.amount || null;
  const blockchain = blockchains[location.state?.blockchain];

  const CustomTokenForm = blockchain ? blockchain.CustomTokenForm : null;
  const WalletForm = blockchain ? blockchain.WalletForm : null;
  const Parcel = blockchain ? blockchain.Parcel : null;

  const [showCustomTokenForm, setShowCustomTokenForm] = useState(false);
  const isTokenSelected = Boolean(blockchain && token);
  const isAmountSet = Boolean(isTokenSelected && amount);
  const isRecipientsSet = Boolean(
    isAmountSet &&
      recipients.length > 0 &&
      recipients.every((addr: string) =>
        location.state?.recipients?.includes(addr)
      )
  );

  const isSendersSet = Boolean(
    senders.length > 0 &&
      senders.every((sender) =>
        location.state?.senders?.includes(sender.address)
      )
  );

  /* Determine if the wallet is configured */
  const isWalletConfigured = Boolean(
    wallet && location.state?.wallet && wallet.address === location.state.wallet
  );

  const setBlockchain = (blockchainId: string) => {
    navigate(location, { state: { blockchain: blockchainId } });
  };

  const setToken = (tokenId: string) => {
    if (tokenId === "custom") {
      setShowCustomTokenForm(true);
      return;
    }
    navigate(location, {
      state: {
        ...location.state,
        token: blockchain?.tokens.find((t) => t.id === tokenId),
      },
    });
  };

  const setCustomToken = (token: Token) => {
    setShowCustomTokenForm(false);
    navigate(location, {
      state: {
        ...location.state,
        token,
      },
    });
  };

  const setAmount = (amount: string) => {
    navigate(location, {
      state: {
        ...location.state,
        amount,
      },
    });
  };

  const configureRecipients = (recipients: string[]) => {
    setRecipients(recipients);
    navigate(location, {
      state: {
        ...location.state,
        recipients,
      },
    });
  };

  const configureSenders = (senders: Wallet[]) => {
    setSenders(senders);
    navigate(location, {
      state: {
        ...location.state,
        senders: senders.map((s) => s.address),
      },
    });
  };

  const configureReceiver = (address: string) => {
    setReceiver(address);
  };

  const configureWallet = (wallet: Wallet) => {
    setWallet(wallet);
  };

  const cancelWalletSetup = () => {
    setWallet(null);
    navigateBack();
  };

  return {
    token,
    wallet,
    amount,
    receiver,
    senders,
    recipients,
    blockchain,
    isAmountSet,
    isTokenSelected,
    isRecipientsSet,
    isSendersSet,
    showCustomTokenForm,
    isWalletConfigured,
    WalletForm,
    CustomTokenForm,
    Parcel,
    setShowCustomTokenForm,
    setBlockchain,
    setToken,
    setAmount,
    setCustomToken,
    configureWallet,
    cancelWalletSetup,
    configureRecipients,
    configureSenders,
    configureReceiver,
  };
};

export { useBlockchain };
