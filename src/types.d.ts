export interface Token {
  id: string;
  name: string;
  icon?: string;
  symbol?: string;
  decimals?: number;
  address?: string;
}

export interface Wallet {
  address: string;
  privateKey?: string;
  mnemonic?: string;
  version?: number;
}

export interface CustomTokenFormProps {
  onSubmit: (token: Token) => void;
  getTokenDetails?: (address: string) => Promise<Partial<Token> | null>;
}

export interface WalletFormProps {
  onSubmit: (wallet: Wallet) => void;
}

export interface Blockchain {
  id: string;
  icon: string;
  name: string;
  tokens: Token[];
  CustomTokenForm: React.ComponentType<CustomTokenFormProps>;
  WalletForm: React.ComponentType<WalletFormProps>;
  ConfigForm?: React.ComponentType<{
    onSubmit: (config: Record<string, unknown>) => void;
  }>;
  Parcel: new ({
    mainnet,
    config,
  }: {
    mainnet: boolean;
    config: Record<string, unknown> | null;
  }) => Parcel;
}

export interface Parcel {
  split: ({
    wallet,
    addresses,
    token,
    amount,
  }: {
    wallet: Wallet;
    addresses: string[];
    token: Token;
    amount: string;
  }) => Promise<TransactionResult[]>;

  merge: ({
    senders,
    receiver,
    token,
    amount,
  }: {
    senders: Wallet[];
    receiver: string;
    token: Token;
    amount?: string;
  }) => Promise<TransactionResult[]>;
}

export interface TransactionResult {
  to: string;
  txHash: string;
  status: boolean;
  error?: string | unknown;
}
