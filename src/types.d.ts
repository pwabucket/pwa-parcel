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
  group: string | null;
  icon: string;
  name: string;
  tokens: Token[];
  CustomTokenForm: React.ComponentType<CustomTokenFormProps>;
  WalletForm: React.ComponentType<WalletFormProps>;
  ConfigForm?: React.ComponentType<{
    onSubmit: (config: Record<string, unknown>) => void;
  }>;
  Parcel: new (params: ParcelParams) => Parcel;
}

export type ParcelMode = "single" | "batch";

export interface ParcelParams {
  mainnet: boolean;
  config: Record<string, unknown> | null;
  mode: ParcelMode;
}

export interface SplitOptions {
  wallet: Wallet;
  addresses: string[];
  token: Token;
  amount: string;
  updateProgress: () => void;
}

export interface MergeOptions {
  senders: Wallet[];
  receiver: string;
  token: Token;
  amount?: string;
  updateProgress: () => void;
}

export interface FeeEstimate {
  /* Estimated native fees spent (human units) */
  fee: string;
  /* Native amount attached to messages but mostly refunded (e.g TON jettons) */
  refundable?: string;
  /* Merge: native fees each sender wallet needs */
  feePerSender?: string;
  transactions: number;
  /* True when fallback constants were used instead of a network estimate */
  approximate: boolean;
}

export interface Parcel {
  split: (splitOptions: SplitOptions) => Promise<TransactionResult[]>;
  merge: (mergeOptions: MergeOptions) => Promise<TransactionResult[]>;
  estimateSplit?: (
    splitOptions: Omit<SplitOptions, "updateProgress">
  ) => Promise<FeeEstimate>;
  estimateMerge?: (
    mergeOptions: Omit<MergeOptions, "updateProgress">
  ) => Promise<FeeEstimate>;
}

export interface TransactionResult {
  to: string;
  txHash: string;
  status: boolean;
  error?: string | unknown;
}
