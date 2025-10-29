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
  const token = location.state?.token || null;
  const blockchain = blockchains[location.state?.blockchain];
  const CustomTokenForm = blockchain ? blockchain.CustomTokenForm : null;
  const WalletForm = blockchain ? blockchain.WalletForm : null;

  const [showCustomTokenForm, setShowCustomTokenForm] = useState(false);
  const showWalletForm = Boolean(blockchain && token);

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

  const cancelWalletSetup = () => {
    setWallet(null);
    navigateBack();
  };

  return {
    wallet,
    token,
    blockchain,
    showWalletForm,
    showCustomTokenForm,
    WalletForm,
    CustomTokenForm,
    setShowCustomTokenForm,
    setBlockchain,
    setToken,
    setWallet,
    setCustomToken,
    cancelWalletSetup,
  };
};

export { useBlockchain };
