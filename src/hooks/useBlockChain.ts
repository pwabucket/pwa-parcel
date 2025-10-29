import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { blockchains } from "../resources/blockchains";
import type { Token, Wallet } from "../types";
import { useNavigateBack } from "./useNavigateBack";

const useBlockchain = () => {
  const navigateBack = useNavigateBack();
  const navigate = useNavigate();
  const location = useLocation();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
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
    isAmountSet && recipients.length === location.state?.addresses
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

  const configureRecipients = (addresses: string[]) => {
    setRecipients(addresses);
    navigate(location, {
      state: {
        ...location.state,
        addresses: addresses.length,
      },
    });
  };

  const configureWallet = (wallet: Wallet) => {
    setWallet(wallet);
    navigate(location, {
      state: {
        ...location.state,
        wallet: wallet.address,
      },
    });
  };

  const cancelWalletSetup = () => {
    setWallet(null);
    navigateBack();
  };

  return {
    token,
    wallet,
    amount,
    recipients,
    blockchain,
    isAmountSet,
    isTokenSelected,
    isRecipientsSet,
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
  };
};

export { useBlockchain };
