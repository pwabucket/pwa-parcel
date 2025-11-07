import { useCallback, useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router";
import { blockchains } from "../resources/blockchains";
import type { Token, Wallet } from "../types";
import { useNavigateBack } from "./useNavigateBack";
import { useOpenerHandler } from "./useOpenerHandler";

interface BlockchainLocationState {
  blockchain?: string;
  token?: Token;
  amount?: string;
  recipients?: string[];
  senders?: string[];
  wallet?: string;
  config?: Record<string, unknown>;
  showCustomTokenForm?: boolean;
}

interface OpenerEventData {
  blockchain: string;
  token: string | Token;
  amount?: string;
  recipients?: string[];
  senders?: Wallet[];
  wallet?: Wallet;
  receiver?: string;
  config?: Record<string, unknown>;
}

const useBlockchain = () => {
  const navigateBack = useNavigateBack();
  const navigate = useNavigate();
  const location: Location<BlockchainLocationState> = useLocation();

  const [mode, setMode] = useState<"single" | "batch">("single");
  const [progress, setProgress] = useState<number>(0);

  /* Split States */
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);

  /* Merge States */
  const [senders, setSenders] = useState<Wallet[]>([]);
  const [receiver, setReceiver] = useState<string | null>(null);

  const showCustomTokenForm = Boolean(location.state?.showCustomTokenForm);
  const config: Record<string, unknown> | null = location.state?.config || null;
  const token: Token | null = location.state?.token || null;
  const amount: string | null = location.state?.amount || null;
  const blockchain = location.state?.blockchain
    ? blockchains[location.state?.blockchain]
    : null;

  const CustomTokenForm = blockchain ? blockchain.CustomTokenForm : null;
  const WalletForm = blockchain ? blockchain.WalletForm : null;
  const ConfigForm = blockchain ? blockchain.ConfigForm : null;
  const Parcel = blockchain ? blockchain.Parcel : null;

  const isBlockchainSelected = Boolean(blockchain);
  const isTokenSelected = Boolean(blockchain && token);
  const isAmountSet = Boolean(isTokenSelected && amount);

  /* Determine if recipients are set */
  const isRecipientsSet = Boolean(
    isAmountSet &&
      recipients.length > 0 &&
      recipients.every((addr: string) =>
        location.state?.recipients?.includes(addr)
      )
  );

  /* Determine if senders are set */
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

  const isConfigAvailable = Boolean(!ConfigForm || config);
  const isConfigMissing = Boolean(ConfigForm && !config);
  const isConfigSet = Boolean(isBlockchainSelected && isConfigAvailable);
  const showConfigForm = Boolean(isBlockchainSelected && isConfigMissing);

  /* Set Blockchain */
  const setBlockchain = (blockchainId: string) => {
    navigate(location, { state: { blockchain: blockchainId } });
  };

  /* Show/Hide Custom Token Form */
  const setShowCustomTokenForm = (show: boolean) => {
    if (show) {
      navigate(location, {
        state: {
          ...location.state,
          showCustomTokenForm: true,
        },
      });
    } else {
      navigateBack();
    }
  };

  /* Set Token */
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

  /* Set Custom Token */
  const setCustomToken = (token: Token) => {
    navigate(location, {
      state: {
        ...location.state,
        showCustomTokenForm: false,
        token,
      },
      replace: true,
    });
  };

  /* Set Amount */
  const setAmount = (amount: string) => {
    navigate(location, {
      state: {
        ...location.state,
        amount,
      },
    });
  };

  /* Configure Recipients */
  const configureRecipients = (recipients: string[]) => {
    setRecipients(recipients);
    navigate(location, {
      state: {
        ...location.state,
        recipients,
      },
    });
  };

  /* Configure Senders */
  const configureSenders = (senders: Wallet[]) => {
    setSenders(senders);
    navigate(location, {
      state: {
        ...location.state,
        senders: senders.map((s) => s.address),
      },
    });
  };

  /* Configure Receiver */
  const configureReceiver = (address: string) => {
    setReceiver(address);
  };

  /* Configure Wallet */
  const configureWallet = (wallet: Wallet) => {
    setWallet(wallet);
  };

  /* Cancel Wallet Setup */
  const cancelWalletSetup = () => {
    setWallet(null);
    navigateBack();
  };

  /* Set Config */
  const setConfig = (config: Record<string, unknown>) => {
    navigate(location, {
      state: {
        ...location.state,
        config,
      },
      replace: true,
    });
  };

  /* Cancel Config Setup */
  const cancelConfigSetup = () => {
    navigateBack();
  };

  /* Progress Management */
  const resetProgress = () => {
    setProgress(0);
  };

  /* Update Progress */
  const updateProgress = () => {
    setProgress((prev) => prev + 1);
  };

  /* Opener Message Handler */
  const handleOpenerMessage = useCallback(
    (event: MessageEvent<OpenerEventData>) => {
      const state: BlockchainLocationState = {};

      const blockchain = blockchains[event.data.blockchain];
      if (!blockchain) return;

      /* Update Blockchain */
      state.blockchain = event.data.blockchain;

      /* Update Config */
      if (blockchain.ConfigForm) {
        if (event.data.config) {
          state.config = event.data.config;
        } else {
          state.config = {};
        }
      }

      /* Update Token */
      if (typeof event.data.token !== "string") {
        state.token = event.data.token;
      } else {
        const token = blockchain.tokens.find((t) => t.id === event.data.token);
        if (!token) {
          return;
        } else {
          state.token = token;
        }
      }

      /* Update Amount */
      if (event.data.amount) {
        state.amount = event.data.amount;
      }

      /* Update Recipients */
      if (event.data.recipients && Array.isArray(event.data.recipients)) {
        state.recipients = event.data.recipients;
        setRecipients(event.data.recipients);
      }

      /* Update Wallet */
      if (event.data.wallet) {
        state.wallet = event.data.wallet.address;
        setWallet(event.data.wallet);
      }

      /* Update Senders */
      if (event.data.senders && Array.isArray(event.data.senders)) {
        state.senders = event.data.senders.map((s) => s.address);
        setSenders(event.data.senders);
      }

      /* Update Receiver */
      if (event.data.receiver) {
        setReceiver(event.data.receiver);
      }

      /* Navigate with updated state */
      navigate(location, { state });
    },
    [navigate, location]
  );

  /* Opener Handler */
  useOpenerHandler(handleOpenerMessage);

  return {
    token,
    blockchain,
    amount,
    wallet,
    receiver,
    senders,
    recipients,
    isAmountSet,
    isTokenSelected,
    isRecipientsSet,
    isSendersSet,
    isBlockchainSelected,
    showConfigForm,
    showCustomTokenForm,
    isWalletConfigured,

    /* Progress Management */
    progress,
    setProgress,
    resetProgress,
    updateProgress,

    /* Forms */
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
    cancelConfigSetup,
    configureRecipients,
    configureSenders,
    configureReceiver,
    ConfigForm,
    config,
    mode,
    setMode,
    setConfig,
    isConfigSet,
  };
};

export { useBlockchain };
