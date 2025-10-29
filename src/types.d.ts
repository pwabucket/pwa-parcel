export interface Token {
  id: string;
  name: string;
  symbol?: string;
  decimals?: number;
  address?: string;
}

export interface Wallet {
  privateKey?: string;
  mnemonic?: string;
}

export interface CustomTokenFormProps {
  onSubmit: (token: Token) => void;
}

export interface WalletFormProps {
  onSubmit: (wallet: Wallet) => void;
}

export interface Blockchain {
  id: string;
  icon: string;
  name?: string;
  tokens: Token[];
  CustomTokenForm: React.ComponentType<CustomTokenFormProps>;
  WalletForm: React.ComponentType<WalletFormProps>;
}
