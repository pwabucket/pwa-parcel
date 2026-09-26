import { ethers } from "ethers";
import type {
  FeeEstimate,
  MergeOptions,
  Parcel,
  ParcelMode,
  ParcelParams,
  SplitOptions,
  Wallet,
} from "../types";
import { calculateAmountPerRecipient } from "../lib/utils";
import Decimal from "decimal.js";

/* EVM Networks Configuration */
export const NETWORKS = {
  bsc: {
    mainnet: "https://bsc-dataseed.binance.org/",
    testnet: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    nativeCurrency: "BNB",
  },
  base: {
    mainnet: "https://mainnet.base.org",
    testnet: "https://sepolia.base.org" /* Base Sepolia */,
    nativeCurrency: "ETH",
  },

  ethereum: {
    mainnet: "https://ethereum-rpc.publicnode.com",
    testnet: "https://ethereum-sepolia-rpc.publicnode.com" /* Sepolia */,
    nativeCurrency: "ETH",
  },
  polygon: {
    mainnet: "https://polygon-bor-rpc.publicnode.com",
    testnet: "https://polygon-amoy-bor-rpc.publicnode.com" /* Amoy */,
    nativeCurrency: "POL",
  },
  avalanche: {
    mainnet: "https://api.avax.network/ext/bc/C/rpc",
    testnet: "https://api.avax-test.network/ext/bc/C/rpc",
    nativeCurrency: "AVAX",
  },
  arbitrum: {
    mainnet: "https://arb1.arbitrum.io/rpc",
    testnet: "https://sepolia-rollup.arbitrum.io/rpc" /* Arbitrum Sepolia */,
    nativeCurrency: "ETH",
  },
  optimism: {
    mainnet: "https://mainnet.optimism.io",
    testnet: "https://sepolia.optimism.io" /* OP Sepolia */,
    nativeCurrency: "ETH",
  },
  fantom: {
    mainnet: "https://rpcapi.fantom.network",
    testnet: "https://rpc.testnet.fantom.network/" /* No longer responding */,
    nativeCurrency: "FTM",
  },
} as const;

/* Gas Configuration */
const FALLBACK_GAS_LIMIT_NATIVE = 21_000n; /* Standard ETH transfer gas limit */
const FALLBACK_GAS_LIMIT_TOKEN =
  60_000n; /* Conservative token transfer estimate */
const FALLBACK_GAS_PRICE = ethers.parseUnits(
  "0.13",
  "gwei"
); /* Fallback if network fetch fails */

/* Standard ERC-20 Token ABI (minimal for transfers) */
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

/* Disperse contract - sends to many recipients in a single transaction */
const DISPERSE_ADDRESS = "0xD152f549545093347A162Dce210e7293f1452150";
const DISPERSE_ABI = [
  "function disperseEther(address[] recipients, uint256[] values) payable",
  "function disperseToken(address token, address[] recipients, uint256[] values)",
];
const DISPERSE_BATCH_SIZE = 200; /* Keeps each transaction well under block gas limits */

/* Fallback gas estimates for Disperse (used when estimation would revert) */
const DISPERSE_BASE_GAS = 50_000n;
const DISPERSE_GAS_PER_RECIPIENT = 35_000n; /* Includes new account / holder costs */
const APPROVE_GAS = 50_000n;

/* Split an array into chunks */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/* Add a 20% safety buffer to a gas limit */
function withGasBuffer(gas: bigint): bigint {
  return gas + (gas * 20n) / 100n;
}

/* Convert an amount to base units, truncating extra decimals */
function toBaseUnits(amount: string, decimals: number): bigint {
  return ethers.parseUnits(
    new Decimal(amount).toDecimalPlaces(decimals, Decimal.ROUND_DOWN).toFixed(),
    decimals
  );
}

export interface TransferResult {
  status: boolean;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  gasUsed?: bigint;
  gasPrice?: bigint;
  error?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export type NetworkName = keyof typeof NETWORKS;

/* Helper function to detect network from chain ID */
function detectNetworkFromChainId(chainId: bigint): {
  network: NetworkName | null;
  mainnet: boolean;
} {
  const chainIdNum = Number(chainId);

  switch (chainIdNum) {
    case 56:
      return { network: "bsc", mainnet: true };
    case 97:
      return { network: "bsc", mainnet: false };
    case 1:
      return { network: "ethereum", mainnet: true };
    case 11155111:
      return { network: "ethereum", mainnet: false };
    case 137:
      return { network: "polygon", mainnet: true };
    case 80002:
      return { network: "polygon", mainnet: false };
    case 43114:
      return { network: "avalanche", mainnet: true };
    case 43113:
      return { network: "avalanche", mainnet: false };
    case 42161:
      return { network: "arbitrum", mainnet: true };
    case 421614:
      return { network: "arbitrum", mainnet: false };
    case 10:
      return { network: "optimism", mainnet: true };
    case 11155420:
      return { network: "optimism", mainnet: false };
    case 8453:
      return { network: "base", mainnet: true };
    case 84532:
      return { network: "base", mainnet: false };
    case 250:
      return { network: "fantom", mainnet: true };
    case 4002:
      return { network: "fantom", mainnet: false };
    default:
      return { network: null, mainnet: true };
  }
}

/* EVMWallet class - handles individual wallet operations */
export class EVMWallet {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private network: NetworkName | null;
  private mainnet: boolean;
  private chainId: bigint | null = null;
  private rpcUrl: string;
  private currentNonce: number | null =
    null; /* Track nonce for split operations */
  private disperseAvailable: boolean | null = null;

  constructor({
    privateKey,
    network,
    mainnet = false,
    rpcUrl,
    provider /* Optional shared provider */,
    chainId /* Optional pre-determined chainId */,
  }: {
    privateKey: string;
    network?: NetworkName;
    mainnet?: boolean;
    rpcUrl?: string;
    provider?: ethers.JsonRpcProvider;
    chainId?: bigint;
  }) {
    if (provider) {
      /* Use shared provider */
      this.provider = provider;
      this.rpcUrl = rpcUrl || "shared-provider"; /* Fallback identifier */
      this.network = null; /* Will be detected from chain ID */
      this.mainnet = mainnet;
    } else if (rpcUrl) {
      /* Direct RPC URL provided */
      this.rpcUrl = rpcUrl;
      this.network = null; /* Will be detected from chain ID */
      this.mainnet = mainnet;
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    } else if (network) {
      /* Network name provided */
      if (!NETWORKS[network]) {
        throw new Error(`Unsupported network: ${network}`);
      }
      this.network = network;
      this.mainnet = mainnet;
      this.rpcUrl = NETWORKS[network][mainnet ? "mainnet" : "testnet"];
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    } else {
      throw new Error("Either network, rpcUrl, or provider must be provided");
    }

    /* Set chainId if provided to avoid network fetch */
    if (chainId) {
      this.chainId = chainId;
      /* If network wasn't specified, detect it from chain ID */
      if (!this.network) {
        const detected = detectNetworkFromChainId(this.chainId);
        this.network = detected.network;
        /* Don't override mainnet if it was explicitly set */
        if (detected.network) {
          this.mainnet = detected.mainnet;
        }
      }
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async initializeNetwork() {
    if (!this.chainId) {
      const networkInfo = await this.provider.getNetwork();
      this.chainId = networkInfo.chainId;

      /* If network wasn't specified, detect it from chain ID */
      if (!this.network) {
        const detected = detectNetworkFromChainId(this.chainId);
        this.network = detected.network;
        /* Don't override mainnet if it was explicitly set */
        if (detected.network) {
          this.mainnet = detected.mainnet;
        }
      }
    }
    return this.chainId;
  }

  async getAddress(): Promise<string> {
    return await this.wallet.getAddress();
  }

  async getNativeBalance(address?: string): Promise<string> {
    const targetAddress = address || (await this.wallet.getAddress());
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(
    tokenAddress: string,
    address?: string
  ): Promise<string> {
    try {
      const targetAddress = address || (await this.wallet.getAddress());
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [balance, decimals] = await Promise.all([
        contract.balanceOf(targetAddress),
        contract.decimals(),
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      return null;
    }
  }

  async transferNative(
    recipientAddress: string,
    amount: string,
    gasPrice?: bigint
  ): Promise<TransferResult> {
    try {
      await this.initializeNetwork();

      const value = ethers.parseEther(amount);
      const nonce = await this.provider.getTransactionCount(
        this.wallet.address,
        "pending"
      );

      /* Use provided gas price or fetch from network */
      const finalGasPrice = gasPrice || (await this.getOptimizedGasPrice());

      /* Estimate gas limit for this specific transaction */
      const gasLimit = await this.estimateGasWithBuffer(
        "native",
        undefined,
        recipientAddress,
        amount
      );

      const tx = {
        to: recipientAddress,
        value,
        gasLimit,
        gasPrice: finalGasPrice,
        chainId: this.chainId!,
        nonce,
      };

      const signedTx = await this.wallet.signTransaction(tx);
      const broadcast = await this.provider.broadcastTransaction(signedTx);
      const receipt = await broadcast.wait();

      return {
        status: true,
        txHash: receipt!.hash,
        from: await this.wallet.getAddress(),
        to: recipientAddress,
        amount,
        gasUsed: receipt!.gasUsed,
        gasPrice: receipt!.gasPrice,
      };
    } catch (error) {
      return {
        status: false,
        txHash: "",
        from: await this.wallet.getAddress(),
        to: recipientAddress,
        amount,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async transferToken(
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    gasPrice?: bigint
  ): Promise<TransferResult> {
    try {
      await this.initializeNetwork();

      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.wallet
      );
      const decimals = await contract.decimals();
      const value = ethers.parseUnits(amount, decimals);

      const nonce = await this.provider.getTransactionCount(
        this.wallet.address,
        "pending"
      );

      /* Use provided gas price or fetch from network */
      const finalGasPrice = gasPrice || (await this.getOptimizedGasPrice());

      /* Estimate gas limit for this specific token transfer */
      const gasLimit = await this.estimateGasWithBuffer(
        "token",
        tokenAddress,
        recipientAddress,
        amount
      );

      const tx = await contract.transfer.populateTransaction(
        recipientAddress,
        value
      );
      const fullTx = {
        ...tx,
        gasLimit,
        gasPrice: finalGasPrice,
        chainId: this.chainId!,
        nonce,
      };

      const signedTx = await this.wallet.signTransaction(fullTx);
      const broadcast = await this.provider.broadcastTransaction(signedTx);
      const receipt = await broadcast.wait();

      return {
        status: true,
        txHash: receipt!.hash,
        from: await this.wallet.getAddress(),
        to: recipientAddress,
        amount,
        gasUsed: receipt!.gasUsed,
        gasPrice: receipt!.gasPrice,
      };
    } catch (error) {
      return {
        status: false,
        txHash: "",
        from: await this.wallet.getAddress(),
        to: recipientAddress,
        amount,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async estimateGas(
    type: "native" | "token",
    tokenAddress?: string,
    recipientAddress?: string,
    amount?: string
  ): Promise<bigint> {
    const { gas } = await this.estimateGasDetailed(
      type,
      tokenAddress,
      recipientAddress,
      amount
    );
    return gas;
  }

  /* Estimate gas, flagging when a fallback limit was used */
  async estimateGasDetailed(
    type: "native" | "token",
    tokenAddress?: string,
    recipientAddress?: string,
    amount?: string
  ): Promise<{ gas: bigint; approximate: boolean }> {
    try {
      await this.initializeNetwork();

      if (type === "native") {
        if (recipientAddress && amount) {
          /* Estimate actual gas for specific native transfer */
          const value = ethers.parseEther(amount);
          const estimatedGas = await this.provider.estimateGas({
            to: recipientAddress,
            value,
            from: this.wallet.address,
          });
          return { gas: estimatedGas, approximate: false };
        }
        return { gas: FALLBACK_GAS_LIMIT_NATIVE, approximate: true };
      } else if (
        type === "token" &&
        tokenAddress &&
        recipientAddress &&
        amount
      ) {
        /* Estimate gas for token transfer */
        const contract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          this.wallet
        );
        const decimals = await contract.decimals();
        const value = ethers.parseUnits(amount, decimals);

        const estimatedGas = await contract.transfer.estimateGas(
          recipientAddress,
          value
        );
        return { gas: estimatedGas, approximate: false };
      }

      return { gas: FALLBACK_GAS_LIMIT_TOKEN, approximate: true };
    } catch (error) {
      console.warn("Gas estimation failed, using fallback:", error);
      return {
        gas:
          type === "native"
            ? FALLBACK_GAS_LIMIT_NATIVE
            : FALLBACK_GAS_LIMIT_TOKEN,
        approximate: true,
      };
    }
  }

  /* Estimate gas with safety buffer */
  async estimateGasWithBuffer(
    type: "native" | "token",
    tokenAddress?: string,
    recipientAddress?: string,
    amount?: string,
    bufferPercent: number = 20
  ): Promise<bigint> {
    const baseGas = await this.estimateGas(
      type,
      tokenAddress,
      recipientAddress,
      amount
    );
    const buffer = (baseGas * BigInt(bufferPercent)) / 100n;
    return baseGas + buffer;
  }

  async getNetworkInfo() {
    await this.initializeNetwork(); /* Ensure network detection is complete */

    return {
      network: this.network,
      mainnet: this.mainnet,
      nativeCurrency: this.network
        ? NETWORKS[this.network].nativeCurrency
        : "UNKNOWN",
      rpc: this.rpcUrl,
      chainId: this.chainId,
    };
  }

  /* Get current gas price from network */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();

      /* Use EIP-1559 if available (maxFeePerGas), otherwise use legacy gasPrice */
      if (feeData.maxFeePerGas) {
        return feeData.maxFeePerGas;
      } else if (feeData.gasPrice) {
        return feeData.gasPrice;
      } else {
        console.warn("Could not fetch gas price from network, using fallback");
        return FALLBACK_GAS_PRICE;
      }
    } catch (error) {
      console.warn("Error fetching gas price:", error);
      return FALLBACK_GAS_PRICE;
    }
  }

  /* Get optimized gas price (slightly higher than current network price for faster confirmation) */
  async getOptimizedGasPrice(multiplier: number = 1.1): Promise<bigint> {
    const currentGasPrice = await this.getGasPrice();
    return BigInt(Math.floor(Number(currentGasPrice) * multiplier));
  }

  /* Initialize nonce for split operations - call once before multiple transfers */
  async initializeNonce(): Promise<void> {
    this.currentNonce = await this.provider.getTransactionCount(
      this.wallet.address,
      "pending"
    );
  }

  /* Get next nonce for split operations */
  private getNextNonce(): number {
    if (this.currentNonce === null) {
      throw new Error("Nonce not initialized. Call initializeNonce() first.");
    }
    return this.currentNonce++;
  }

  /* Check if the Disperse contract is deployed on this network */
  async isDisperseAvailable(): Promise<boolean> {
    if (this.disperseAvailable === null) {
      try {
        const code = await this.provider.getCode(DISPERSE_ADDRESS);
        this.disperseAvailable = code !== "0x";
      } catch {
        this.disperseAvailable = false;
      }
    }
    return this.disperseAvailable;
  }

  async getTokenDecimals(tokenAddress: string): Promise<number> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return Number(await contract.decimals());
  }

  /* Estimate gas, sign with the tracked nonce and broadcast */
  private async signAndBroadcast(
    tx: ethers.TransactionRequest,
    gasPrice: bigint
  ) {
    await this.initializeNetwork();

    /* Estimate before taking a nonce so a failed estimate leaves no gap */
    const gasLimit = withGasBuffer(await this.wallet.estimateGas(tx));

    const signedTx = await this.wallet.signTransaction({
      ...tx,
      gasLimit,
      gasPrice,
      chainId: this.chainId!,
      nonce: this.getNextNonce(),
    });

    return this.provider.broadcastTransaction(signedTx);
  }

  /* Broadcast a single transfer without waiting for confirmation */
  async broadcastTransfer(
    recipientAddress: string,
    value: bigint,
    gasPrice: bigint,
    tokenAddress?: string
  ) {
    const tx = tokenAddress
      ? await new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          this.wallet
        ).transfer.populateTransaction(recipientAddress, value)
      : { to: recipientAddress, value };

    return this.signAndBroadcast(tx, gasPrice);
  }

  /* Approve exactly `total` for Disperse if the current allowance is too low */
  private async ensureDisperseAllowance(
    tokenAddress: string,
    total: bigint,
    gasPrice: bigint
  ) {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const allowance: bigint = await token.allowance(
      this.wallet.address,
      DISPERSE_ADDRESS
    );

    if (allowance >= total) return;

    /* Some tokens (e.g USDT) reject changing a non-zero allowance */
    if (allowance > 0n) {
      const reset = await this.signAndBroadcast(
        await token.approve.populateTransaction(DISPERSE_ADDRESS, 0n),
        gasPrice
      );
      await reset.wait();
    }

    const approval = await this.signAndBroadcast(
      await token.approve.populateTransaction(DISPERSE_ADDRESS, total),
      gasPrice
    );
    await approval.wait();
  }

  /* Send native currency to multiple recipients in a single transaction */
  async disperseNative(
    recipients: string[],
    values: bigint[],
    gasPrice: bigint
  ): Promise<string> {
    const disperse = new ethers.Contract(
      DISPERSE_ADDRESS,
      DISPERSE_ABI,
      this.wallet
    );
    const total = values.reduce((sum, value) => sum + value, 0n);

    const broadcast = await this.signAndBroadcast(
      await disperse.disperseEther.populateTransaction(recipients, values, {
        value: total,
      }),
      gasPrice
    );
    const receipt = await broadcast.wait();

    return receipt!.hash;
  }

  /* Send tokens to multiple recipients in a single transaction */
  async disperseToken(
    tokenAddress: string,
    recipients: string[],
    values: bigint[],
    gasPrice: bigint
  ): Promise<string> {
    const disperse = new ethers.Contract(
      DISPERSE_ADDRESS,
      DISPERSE_ABI,
      this.wallet
    );
    const total = values.reduce((sum, value) => sum + value, 0n);

    await this.ensureDisperseAllowance(tokenAddress, total, gasPrice);

    const broadcast = await this.signAndBroadcast(
      await disperse.disperseToken.populateTransaction(
        tokenAddress,
        recipients,
        values
      ),
      gasPrice
    );
    const receipt = await broadcast.wait();

    return receipt!.hash;
  }

  /* Estimate total gas for dispersing `value` to each recipient */
  async estimateDisperseGas(
    recipients: string[],
    value: bigint,
    tokenAddress?: string
  ): Promise<{ gas: bigint; transactions: number; approximate: boolean }> {
    const chunks = chunk(recipients, DISPERSE_BATCH_SIZE);
    const fallbackGas = (count: number) =>
      DISPERSE_BASE_GAS + DISPERSE_GAS_PER_RECIPIENT * BigInt(count);

    if (tokenAddress) {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const total = value * BigInt(recipients.length);
      const allowance: bigint = await token.allowance(
        this.wallet.address,
        DISPERSE_ADDRESS
      );

      /* disperseToken reverts without allowance, so it can't be simulated yet */
      if (allowance < total) {
        const approvals = allowance > 0n ? 2 : 1;
        const gas =
          APPROVE_GAS * BigInt(approvals) +
          chunks.reduce((sum, c) => sum + fallbackGas(c.length), 0n);

        return {
          gas: withGasBuffer(gas),
          transactions: chunks.length + approvals,
          approximate: true,
        };
      }
    }

    const disperse = new ethers.Contract(
      DISPERSE_ADDRESS,
      DISPERSE_ABI,
      this.wallet
    );

    let gas = 0n;
    let approximate = false;

    for (const recipientsChunk of chunks) {
      const values = recipientsChunk.map(() => value);
      try {
        gas += withGasBuffer(
          tokenAddress
            ? await disperse.disperseToken.estimateGas(
                tokenAddress,
                recipientsChunk,
                values
              )
            : await disperse.disperseEther.estimateGas(
                recipientsChunk,
                values,
                { value: value * BigInt(recipientsChunk.length) }
              )
        );
      } catch {
        /* e.g insufficient balance - fall back to a rough estimate */
        gas += withGasBuffer(fallbackGas(recipientsChunk.length));
        approximate = true;
      }
    }

    return { gas, transactions: chunks.length, approximate };
  }
}

export interface EVMParcelOptions extends ParcelParams {
  network?: NetworkName;
  rpcUrl?: string;
}

/* EVMParcel class - orchestrates multiple operations using EVMWallet */
export class EVMParcel implements Parcel {
  private network: NetworkName | null;
  private mainnet: boolean;
  private rpcUrl?: string;
  private sharedProvider: ethers.JsonRpcProvider;
  private chainId: bigint | null = null;
  private mode: ParcelMode;

  constructor({ network, mainnet = false, rpcUrl, mode }: EVMParcelOptions) {
    this.mode = mode;

    if (rpcUrl) {
      /* Direct RPC URL provided */
      this.rpcUrl = rpcUrl;
      this.network = null; /* Will be detected from chain ID */
      this.mainnet = mainnet;
      this.sharedProvider = new ethers.JsonRpcProvider(this.rpcUrl);
    } else if (network) {
      /* Network name provided */
      if (!NETWORKS[network]) {
        throw new Error(`Unsupported network: ${network}`);
      }
      this.network = network;
      this.mainnet = mainnet;
      this.rpcUrl = NETWORKS[network][mainnet ? "mainnet" : "testnet"];
      this.sharedProvider = new ethers.JsonRpcProvider(this.rpcUrl);
    } else {
      throw new Error("Either network or rpcUrl must be provided");
    }
  }

  async initializeNetwork() {
    if (!this.chainId) {
      const networkInfo = await this.sharedProvider.getNetwork();
      this.chainId = networkInfo.chainId;

      /* If network wasn't specified, detect it from chain ID */
      if (!this.network) {
        const detected = detectNetworkFromChainId(this.chainId);
        this.network = detected.network;
        /* Don't override mainnet if it was explicitly set */
        if (detected.network) {
          this.mainnet = detected.mainnet;
        }
      }
    }
    return this.chainId;
  }

  private createWallet(privateKey: string): EVMWallet {
    return new EVMWallet({
      privateKey,
      network: this.network || undefined,
      mainnet: this.mainnet,
      rpcUrl: this.rpcUrl,
      provider: this.sharedProvider,
      chainId: this.chainId || undefined,
    });
  }

  /* Split amount equally among multiple addresses */
  async split({
    wallet,
    addresses,
    token,
    amount,
    updateProgress,
    options = {},
  }: SplitOptions & {
    options?: {
      gasPrice?: bigint;
    };
  }): Promise<TransferResult[]> {
    if (addresses.length === 0) {
      throw new Error("No addresses provided");
    }

    await this.initializeNetwork(); /* Ensure shared provider is initialized */

    const walletInstance = this.createWallet(wallet.privateKey!);
    await walletInstance.initializeNonce(); /* Initialize nonce tracking */

    const from = await walletInstance.getAddress();
    const perAddressAmount = calculateAmountPerRecipient(
      amount,
      addresses.length
    );

    /* Fetch once for the whole split */
    const gasPrice =
      options?.gasPrice || (await walletInstance.getOptimizedGasPrice());
    const value = toBaseUnits(
      perAddressAmount,
      token.address ? await walletInstance.getTokenDecimals(token.address) : 18
    );

    const failed = (address: string, error: unknown): TransferResult => ({
      status: false,
      txHash: "",
      from,
      to: address,
      amount: perAddressAmount,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    const results: TransferResult[] = [];

    if (await walletInstance.isDisperseAvailable()) {
      /* Send each chunk of recipients in a single transaction */
      for (const recipients of chunk(addresses, DISPERSE_BATCH_SIZE)) {
        const values = recipients.map(() => value);

        try {
          const txHash = token.address
            ? await walletInstance.disperseToken(
                token.address,
                recipients,
                values,
                gasPrice
              )
            : await walletInstance.disperseNative(recipients, values, gasPrice);

          for (const address of recipients) {
            results.push({
              status: true,
              txHash,
              from,
              to: address,
              amount: perAddressAmount,
            });
            updateProgress();
          }
        } catch (error) {
          /* Resync nonce in case a transaction was never mined */
          await walletInstance.initializeNonce();

          for (const address of recipients) {
            results.push(failed(address, error));
            updateProgress();
          }
        }
      }

      return results;
    }

    /* No Disperse: broadcast all transfers back to back, then wait for receipts */
    const pending: Promise<TransferResult>[] = [];
    let broadcastError: unknown = null;

    for (const address of addresses) {
      /* A failed broadcast leaves a nonce gap that blocks later transfers */
      if (broadcastError) {
        pending.push(Promise.resolve(failed(address, broadcastError)));
        updateProgress();
        continue;
      }

      try {
        const tx = await walletInstance.broadcastTransfer(
          address,
          value,
          gasPrice,
          token.address
        );

        pending.push(
          tx
            .wait()
            .then(
              (receipt): TransferResult => ({
                status: true,
                txHash: receipt!.hash,
                from,
                to: address,
                amount: perAddressAmount,
                gasUsed: receipt!.gasUsed,
                gasPrice: receipt!.gasPrice,
              }),
              (error) => failed(address, error)
            )
            .finally(() => updateProgress())
        );
      } catch (error) {
        broadcastError = error;
        pending.push(Promise.resolve(failed(address, error)));
        updateProgress();
      }
    }

    return Promise.all(pending);
  }

  /* Merge (collect) from multiple addresses to a single address */
  async merge({
    senders,
    receiver,
    token,
    amount,
    retain,
    updateProgress,
    options = {},
  }: MergeOptions & {
    options?: {
      gasPrice?: bigint;
    };
  }): Promise<TransferResult[]> {
    if (senders.length === 0) {
      throw new Error("No wallets provided");
    }

    /* Transfer callback for each sender */
    const transferCallback = async (sender: Wallet) => {
      const wallet = this.createWallet(sender.privateKey!);

      try {
        let amountToSend: string;

        /* Amount is what to keep in the wallet rather than what to send */
        const retaining = Boolean(amount && retain);

        if (token.address) {
          /* Token merge */
          if (retaining) {
            const decimals = await wallet.getTokenDecimals(token.address);
            const balance = await wallet.getTokenBalance(token.address);
            const available =
              toBaseUnits(balance, decimals) - toBaseUnits(amount!, decimals);

            amountToSend =
              available > 0n ? ethers.formatUnits(available, decimals) : "0";
          } else if (amount) {
            amountToSend = amount;
          } else {
            const balance = await wallet.getTokenBalance(token.address);
            amountToSend = balance;
          }
        } else {
          /* Native merge */
          if (amount && !retaining) {
            amountToSend = amount;
          } else {
            /* Merge everything but deduct estimated gas cost */
            const balance = await wallet.getNativeBalance();
            const balanceWei = ethers.parseEther(balance);

            /* Estimate gas cost for the transaction */
            const gasPrice =
              options?.gasPrice || (await wallet.getOptimizedGasPrice());
            const gasLimit = await wallet.estimateGasWithBuffer(
              "native",
              undefined,
              receiver,
              "0.1" /* Use a small amount for estimation */
            );
            const gasCost = gasPrice * gasLimit;

            /* Calculate available amount after gas (and retained amount) */
            const retainWei = retaining ? toBaseUnits(amount!, 18) : 0n;
            const availableWei = balanceWei - gasCost - retainWei;

            if (availableWei <= 0n) {
              amountToSend = "0";
            } else {
              amountToSend = ethers.formatEther(availableWei);
            }
          }
        }

        if (parseFloat(amountToSend) <= 0) {
          return {
            status: false,
            txHash: "",
            from: await wallet.getAddress(),
            to: receiver,
            amount: "0",
            error: retaining
              ? "Balance does not exceed retained amount"
              : "Insufficient balance to merge",
          };
        }

        const result = token.address
          ? await wallet.transferToken(
              token.address,
              receiver,
              amountToSend,
              options?.gasPrice
            )
          : await wallet.transferNative(
              receiver,
              amountToSend,
              options?.gasPrice
            );

        /* Update progress after each transfer */
        updateProgress();

        return result;
      } catch (error) {
        /* Update progress even on failure */
        updateProgress();

        return {
          status: false,
          txHash: "",
          from: await wallet.getAddress(),
          to: receiver,
          amount: "0",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    };

    if (this.mode === "single") {
      /* Execute transfers sequentially in single mode */
      const results: TransferResult[] = [];
      for (const sender of senders) {
        const result = await transferCallback(sender);
        results.push(result);
      }
      return results;
    } else {
      /* Create transfer promises for parallel execution */
      const transferPromises = senders.map((sender) =>
        transferCallback(sender)
      );

      /* Execute all transfers in parallel */
      const results = await Promise.all(transferPromises);
      return results;
    }
  }

  async getNetworkInfo() {
    /* Initialize network using shared provider */
    await this.initializeNetwork();

    return {
      network: this.network,
      mainnet: this.mainnet,
      nativeCurrency: this.network
        ? NETWORKS[this.network].nativeCurrency
        : "UNKNOWN",
      rpc:
        this.rpcUrl ||
        (this.network
          ? NETWORKS[this.network][this.mainnet ? "mainnet" : "testnet"]
          : "unknown"),
      chainId: this.chainId,
    };
  }

  /* Get current network gas prices */
  async getNetworkGasPrices(): Promise<{
    gasPrice: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }> {
    await this.initializeNetwork();

    try {
      const feeData = await this.sharedProvider.getFeeData();

      return {
        gasPrice: feeData.gasPrice || FALLBACK_GAS_PRICE,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
      };
    } catch (error) {
      console.warn("Error fetching network gas prices:", error);
      return {
        gasPrice: FALLBACK_GAS_PRICE,
      };
    }
  }

  /* Estimate gas for a specific transaction */
  async estimateTransactionGas(
    wallet: Wallet,
    type: "native" | "token",
    recipientAddress: string,
    amount: string,
    tokenAddress?: string
  ): Promise<{
    gasLimit: bigint;
    gasPrice: bigint;
    estimatedCost: bigint;
    approximate: boolean;
  }> {
    await this.initializeNetwork();

    const walletInstance = this.createWallet(wallet.privateKey!);

    const { gas, approximate } = await walletInstance.estimateGasDetailed(
      type,
      tokenAddress,
      recipientAddress,
      amount
    );

    /* Same 20% safety buffer as estimateGasWithBuffer */
    const gasLimit = gas + (gas * 20n) / 100n;
    const gasPrice = await walletInstance.getOptimizedGasPrice();
    const estimatedCost = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimatedCost,
      approximate,
    };
  }

  /* Estimate total fees for a split */
  async estimateSplit({
    wallet,
    addresses,
    token,
    amount,
  }: Omit<SplitOptions, "updateProgress">): Promise<FeeEstimate> {
    await this.initializeNetwork();

    const perAddressAmount = calculateAmountPerRecipient(
      amount,
      addresses.length
    );
    const walletInstance = this.createWallet(wallet.privateKey!);

    if (await walletInstance.isDisperseAvailable()) {
      const value = toBaseUnits(
        perAddressAmount,
        token.address
          ? await walletInstance.getTokenDecimals(token.address)
          : 18
      );
      const { gas, transactions, approximate } =
        await walletInstance.estimateDisperseGas(
          addresses,
          value,
          token.address
        );
      const gasPrice = await walletInstance.getOptimizedGasPrice();

      return {
        fee: ethers.formatEther(gas * gasPrice),
        transactions,
        approximate,
      };
    }

    /* All transfers are the same shape, so estimate one and multiply */
    const { estimatedCost, approximate } = await this.estimateTransactionGas(
      wallet,
      token.address ? "token" : "native",
      addresses[0],
      perAddressAmount,
      token.address
    );

    return {
      fee: ethers.formatEther(estimatedCost * BigInt(addresses.length)),
      transactions: addresses.length,
      approximate,
    };
  }

  /* Estimate total fees for a merge, each sender pays its own gas */
  async estimateMerge({
    senders,
    receiver,
    token,
    amount,
    retain,
  }: Omit<MergeOptions, "updateProgress">): Promise<FeeEstimate> {
    /* Use "0" when merging everything (or retaining) so estimation doesn't revert on balance */
    const { estimatedCost, approximate } = await this.estimateTransactionGas(
      senders[0],
      token.address ? "token" : "native",
      receiver,
      (!retain && amount) || "0",
      token.address
    );

    return {
      fee: ethers.formatEther(estimatedCost * BigInt(senders.length)),
      feePerSender: ethers.formatEther(estimatedCost),
      transactions: senders.length,
      approximate,
    };
  }
}
