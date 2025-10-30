import { ethers } from "ethers";
import type { Parcel, Token, Wallet } from "../types";

/* EVM Networks Configuration */
export const NETWORKS = {
  bsc: {
    mainnet: "https://bsc-dataseed1.binance.org/",
    testnet: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    nativeCurrency: "BNB",
  },
  ethereum: {
    mainnet: "https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
    testnet: "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
    nativeCurrency: "ETH",
  },
  polygon: {
    mainnet: "https://polygon-rpc.com/",
    testnet: "https://rpc-mumbai.maticvigil.com/",
    nativeCurrency: "MATIC",
  },
  avalanche: {
    mainnet: "https://api.avax.network/ext/bc/C/rpc",
    testnet: "https://api.avax-test.network/ext/bc/C/rpc",
    nativeCurrency: "AVAX",
  },
  arbitrum: {
    mainnet: "https://arb1.arbitrum.io/rpc",
    testnet: "https://rinkeby.arbitrum.io/rpc",
    nativeCurrency: "ETH",
  },
  optimism: {
    mainnet: "https://mainnet.optimism.io",
    testnet: "https://kovan.optimism.io",
    nativeCurrency: "ETH",
  },
  fantom: {
    mainnet: "https://rpc.ftm.tools/",
    testnet: "https://rpc.testnet.fantom.network/",
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
];

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
    case 80001:
      return { network: "polygon", mainnet: false };
    case 43114:
      return { network: "avalanche", mainnet: true };
    case 43113:
      return { network: "avalanche", mainnet: false };
    case 42161:
      return { network: "arbitrum", mainnet: true };
    case 421611:
      return { network: "arbitrum", mainnet: false };
    case 10:
      return { network: "optimism", mainnet: true };
    case 69:
      return { network: "optimism", mainnet: false };
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
          return estimatedGas;
        }
        return FALLBACK_GAS_LIMIT_NATIVE;
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
        return estimatedGas;
      }

      return FALLBACK_GAS_LIMIT_TOKEN;
    } catch (error) {
      console.warn("Gas estimation failed, using fallback:", error);
      return type === "native"
        ? FALLBACK_GAS_LIMIT_NATIVE
        : FALLBACK_GAS_LIMIT_TOKEN;
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

  /* Optimized transfer for split operations - uses tracked nonce */
  async splitTransferNative(
    recipientAddress: string,
    amount: string,
    gasPrice?: bigint
  ): Promise<TransferResult> {
    try {
      await this.initializeNetwork();

      const value = ethers.parseEther(amount);
      const nonce = this.getNextNonce();

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

  /* Optimized transfer for split operations - uses tracked nonce */
  async splitTransferToken(
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
      const nonce = this.getNextNonce();

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
}

/* EVMParcel class - orchestrates multiple operations using EVMWallet */
export class EVMParcel implements Parcel {
  private network: NetworkName | null;
  private mainnet: boolean;
  private rpcUrl?: string;
  private sharedProvider: ethers.JsonRpcProvider;
  private chainId: bigint | null = null;

  constructor({
    network,
    mainnet = false,
    rpcUrl,
  }: {
    network?: NetworkName;
    mainnet?: boolean;
    rpcUrl?: string;
  }) {
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
    options = {},
  }: {
    wallet: Wallet;
    addresses: string[];
    token: Token;
    amount: string;
    options?: {
      gasPrice?: bigint;
      contractAddress?: string /* If provided, treats as token transfer */;
    };
  }): Promise<TransferResult[]> {
    if (addresses.length === 0) {
      throw new Error("No addresses provided");
    }

    await this.initializeNetwork(); /* Ensure shared provider is initialized */

    const walletInstance = this.createWallet(wallet.privateKey!);
    await walletInstance.initializeNonce(); /* Initialize nonce tracking */

    const perAddressAmount = token.address
      ? (parseFloat(amount) / addresses.length).toString()
      : (parseFloat(amount) / addresses.length).toFixed(18);

    /* Create split transfer promises for parallel execution */
    const transferPromises = addresses.map((address) =>
      token.address
        ? walletInstance.splitTransferToken(
            token.address,
            address,
            perAddressAmount,
            options?.gasPrice
          )
        : walletInstance.splitTransferNative(
            address,
            perAddressAmount,
            options?.gasPrice
          )
    );

    /* Execute all transfers in parallel */
    const results = await Promise.all(transferPromises);
    return results;
  }

  /* Merge (collect) from multiple addresses to a single address */
  async merge({
    senders,
    receiver,
    token,
    amount,
    options = {},
  }: {
    senders: Wallet[];
    receiver: string;
    token: Token;
    amount?: string;
    options?: {
      gasPrice?: bigint;
    };
  }): Promise<TransferResult[]> {
    if (senders.length === 0) {
      throw new Error("No wallets provided");
    }

    /* Create transfer promises for parallel execution */
    const transferPromises = senders.map(async (sender) => {
      const wallet = this.createWallet(sender.privateKey!);

      try {
        let amountToSend: string;

        if (token.address) {
          /* Token merge */
          if (amount) {
            amountToSend = amount;
          } else {
            const balance = await wallet.getTokenBalance(token.address);
            amountToSend = balance;
          }
        } else {
          /* Native merge */
          if (amount) {
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

            /* Calculate available amount after gas */
            const availableWei = balanceWei - gasCost;

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
            error: "Insufficient balance to merge",
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

        return result;
      } catch (error) {
        return {
          status: false,
          txHash: "",
          from: await wallet.getAddress(),
          to: receiver,
          amount: "0",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    /* Execute all transfers in parallel */
    const results = await Promise.all(transferPromises);
    return results;
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
  }> {
    await this.initializeNetwork();

    const walletInstance = this.createWallet(wallet.privateKey!);

    const gasLimit = await walletInstance.estimateGasWithBuffer(
      type,
      tokenAddress,
      recipientAddress,
      amount
    );

    const gasPrice = await walletInstance.getOptimizedGasPrice();
    const estimatedCost = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimatedCost,
    };
  }
}
