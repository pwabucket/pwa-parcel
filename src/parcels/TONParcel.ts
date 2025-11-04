import {
  TonClient,
  Address,
  fromNano,
  toNano,
  WalletContractV4,
  WalletContractV5R1,
  JettonMaster,
  beginCell,
  JettonWallet,
  type OpenedContract,
  internal,
  SendMode,
} from "@ton/ton";
import { mnemonicNew, mnemonicToWalletKey, type KeyPair } from "@ton/crypto";
import type {
  Parcel,
  Wallet,
  Token,
  TransactionResult,
  ParcelParams,
} from "../types";

/* Simple HTTP client for TON API */
class TonApiClient {
  private baseUrl: string;

  constructor(mainnet = false) {
    this.baseUrl = mainnet
      ? "https://tonapi.io/v2"
      : "https://testnet.tonapi.io/v2";
  }

  async getJettonInfo(jettonAddress: string) {
    try {
      const response = await fetch(`${this.baseUrl}/jettons/${jettonAddress}`);
      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      return {
        decimals: data.metadata?.decimals
          ? parseInt(data.metadata.decimals)
          : 9,
        name: data.metadata?.name,
        symbol: data.metadata?.symbol,
        image: data.metadata?.image,
      };
    } catch (error) {
      console.warn("Failed to fetch jetton info from API:", error);
      return { decimals: 9 };
    }
  }
}

const TON_MAINNET_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_TESTNET_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC";

export interface WalletConfig {
  seedPhrase: string;
  version: 4 | 5;
}

/* TONWallet class - handles individual wallet operations */
class TONWallet {
  private seedPhrase: string;
  private version: 4 | 5;
  private client: TonClient;
  private wallet: {
    keyPair: KeyPair;
    contract:
      | OpenedContract<WalletContractV4>
      | OpenedContract<WalletContractV5R1>;
    address: Address;
  } | null = null;

  constructor({
    seedPhrase,
    mainnet = false,
    version = 5,
    apiKey,
    client /* Optional shared client */,
  }: {
    seedPhrase: string;
    mainnet?: boolean;
    version?: 4 | 5;
    client?: TonClient;
    apiKey?: string;
  }) {
    this.seedPhrase = seedPhrase;
    this.version = version;

    if (client) {
      /* Use shared client */
      this.client = client;
    } else {
      /* Create new client */
      this.client = new TonClient({
        endpoint: mainnet ? TON_MAINNET_RPC : TON_TESTNET_RPC,
        apiKey: apiKey
          ? apiKey
          : mainnet
          ? import.meta.env.VITE_TON_MAINNET_API_KEY
          : import.meta.env.VITE_TON_TESTNET_API_KEY,
      });
    }
  }

  async initWallet() {
    if (this.wallet) return this.wallet;

    const keyPair = await mnemonicToWalletKey(this.seedPhrase.split(" "));

    const contract =
      this.version === 4
        ? WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
          })
        : WalletContractV5R1.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
          });

    const opened = this.client.open(contract);

    this.wallet = {
      keyPair,
      contract: opened,
      address: opened.address,
    };

    return this.wallet;
  }

  private isWalletV4(
    _contract:
      | OpenedContract<WalletContractV4>
      | OpenedContract<WalletContractV5R1>
  ): _contract is OpenedContract<WalletContractV4> {
    return this.version === 4;
  }

  private isWalletV5(
    _contract:
      | OpenedContract<WalletContractV4>
      | OpenedContract<WalletContractV5R1>
  ): _contract is OpenedContract<WalletContractV5R1> {
    return this.version === 5;
  }

  async getAccount(address: string) {
    try {
      const state = await this.client.getContractState(Address.parse(address));
      return {
        balance: state.balance ? fromNano(state.balance) : "0",
        state: state.state ?? "uninitialized",
      };
    } catch {
      return { balance: "0", state: "unknown" };
    }
  }

  async isWalletDeployed(): Promise<boolean> {
    await this.initWallet();
    try {
      const state = await this.client.getContractState(this.wallet!.address);
      console.log("Wallet state:", state);
      return state.state === "active";
    } catch {
      return false;
    }
  }

  async deployWallet(): Promise<void> {
    await this.initWallet();

    /* Check if wallet is already deployed */
    if (await this.isWalletDeployed()) {
      return;
    }

    /* Check if wallet has sufficient balance for deployment */
    const balance = await this.client.getBalance(this.wallet!.address);

    console.log("Balance for deployment:", fromNano(balance));

    const minDeploymentBalance =
      toNano("0.05"); /* Higher minimum balance for reliable deployment */

    if (balance < minDeploymentBalance) {
      throw new Error(
        `Insufficient balance for wallet deployment. Required: ${fromNano(
          minDeploymentBalance
        )} TON, Available: ${fromNano(balance)} TON`
      );
    }

    /* Create a simple transfer to self to deploy the wallet */
    const seqno = await this.wallet!.contract.getSeqno();

    let transfer;
    if (this.isWalletV4(this.wallet!.contract)) {
      transfer = await this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode:
          SendMode.PAY_GAS_SEPARATELY /* Remove IGNORE_ERRORS for better error detection */,
        messages: [
          internal({
            to: this.wallet!.address,
            value: toNano("0.0055") /* Deployment amount */,
            bounce: false /* Important: set bounce to false for deployment */,
          }),
        ],
      });
    } else if (this.isWalletV5(this.wallet!.contract)) {
      transfer = this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode:
          SendMode.PAY_GAS_SEPARATELY /* Remove IGNORE_ERRORS for better error detection */,
        messages: [
          internal({
            to: this.wallet!.address,
            value: toNano("0.0055") /* Deployment amount */,
            bounce: false /* Important: set bounce to false for deployment */,
          }),
        ],
      });
    } else {
      throw new Error("Unsupported wallet version");
    }

    /* Send the deployment transaction */
    await this.client.sendExternalMessage(this.wallet!.contract, transfer);

    /* Wait for deployment confirmation */
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      if (await this.isWalletDeployed()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Wallet deployment timeout");
  }

  private async waitForTransaction(
    expectedSeqno: number,
    timeout = 60000
  ): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        /* Check if seqno has increased (transaction confirmed) */
        const currentSeqno = await this.wallet!.contract.getSeqno();

        if (currentSeqno > expectedSeqno) {
          /* Transaction confirmed, now get transaction history to find the hash */
          const transactions = await this.client.getTransactions(
            this.wallet!.address,
            { limit: 10 } /* Increased limit to find our transaction */
          );

          /* Find the most recent transaction */
          if (transactions.length > 0) {
            /* Get the latest transaction */
            const latestTx = transactions[0];
            const txHash = latestTx.hash().toString("hex");

            /* Check if transaction was successful */
            if (
              latestTx.description.type === "generic" &&
              latestTx.description.computePhase.type === "vm" &&
              latestTx.description.computePhase.success
            ) {
              console.log("Transaction successful:", txHash);
              return txHash;
            } else {
              console.error(
                "Transaction failed on-chain:",
                latestTx.description
              );
              throw new Error(`Transaction failed on-chain. Hash: ${txHash}`);
            }
          }
        }

        /* Wait before next check */
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn("Error checking transaction status:", error);
        /* If this is a transaction failure error, re-throw it */
        if (
          error instanceof Error &&
          error.message.includes("Transaction failed")
        ) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    /* Timeout reached, return empty hash */
    throw new Error("Transaction confirmation timeout");
  }

  async getNativeTonBalance(): Promise<string> {
    await this.initWallet();
    const balance = await this.client.getBalance(this.wallet!.address);
    return fromNano(balance);
  }

  async transferNativeTon(
    recipientAddress: string,
    amountTon: string,
    gasIncluded: boolean = false
  ) {
    await this.initWallet();

    /* Automatically deploy wallet if not already deployed */
    await this.deployWallet();

    /* Log transfer details */
    console.log(
      "Transferring",
      amountTon,
      "TON to",
      recipientAddress,
      gasIncluded ? "(gas included)" : "(gas separate)"
    );

    const recipient = Address.parse(recipientAddress);
    const amountNano = toNano(amountTon);

    /* Only check balance and gas requirements if gas is not included */
    if (!gasIncluded) {
      /* Check if wallet has sufficient balance for transfer + gas */
      const currentBalance = await this.client.getBalance(this.wallet!.address);
      const gasEstimate = toNano("0.0055"); /* Estimate gas fees */
      const totalRequired = amountNano + gasEstimate;

      console.log("Balance for transfer:", fromNano(currentBalance));

      if (currentBalance < totalRequired) {
        throw new Error(
          `Insufficient balance. Required: ${fromNano(
            totalRequired
          )} TON (${amountTon} + gas), Available: ${fromNano(
            currentBalance
          )} TON`
        );
      }
    }

    const seqno = await this.wallet!.contract.getSeqno();

    console.log("Amount (nano):", amountNano.toString());
    console.log("Amount (TON):", fromNano(amountNano));
    console.log("Seqno:", seqno);

    let transfer;

    /* Determine send mode based on gasIncluded parameter */
    const sendMode = gasIncluded
      ? SendMode.CARRY_ALL_REMAINING_BALANCE
      : SendMode.PAY_GAS_SEPARATELY;

    if (this.isWalletV4(this.wallet!.contract)) {
      transfer = await this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode,
        messages: [
          internal({
            to: recipient,
            value: amountNano,
            bounce: false,
          }) /* Set bounce to false for regular transfers */,
        ],
      });
    } else if (this.isWalletV5(this.wallet!.contract)) {
      transfer = this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode,
        messages: [
          internal({
            to: recipient,
            value: amountNano,
            bounce: false,
          }) /* Set bounce to false for regular transfers */,
        ],
      });
    } else {
      throw new Error("Unsupported wallet version");
    }

    /* Send the transaction */
    await this.client.sendExternalMessage(this.wallet!.contract, transfer);

    /* Wait for transaction confirmation and get the hash */
    const txHash = await this.waitForTransaction(seqno);

    return {
      from: this.wallet!.address.toString(),
      to: recipient.toString(),
      amount: amountTon,
      txHash,
    };
  }

  async getJettonBalance(
    jettonMasterAddress: string,
    jettonDecimals: number
  ): Promise<string> {
    await this.initWallet();

    try {
      const master = this.client.open(
        JettonMaster.create(Address.parse(jettonMasterAddress))
      );
      const walletAddress = await master.getWalletAddress(
        this.wallet!.contract.address
      );
      const jettonWallet = this.client.open(JettonWallet.create(walletAddress));
      const balance = await jettonWallet.getBalance();

      /* Convert balance using correct decimals */
      const divisor = BigInt(10 ** jettonDecimals);
      const balanceNumber = Number(balance) / Number(divisor);

      return balanceNumber.toString();
    } catch {
      return "0";
    }
  }

  async transferJetton(
    jettonMasterAddress: string,
    jettonDecimals: number,
    recipientAddress: string,
    jettonAmount: string
  ) {
    await this.initWallet();

    /* Automatically deploy wallet if not already deployed */
    await this.deployWallet();

    const master = this.client.open(
      JettonMaster.create(Address.parse(jettonMasterAddress))
    );

    const jettonWalletAddress = await master.getWalletAddress(
      this.wallet!.contract.address
    );

    const jettonWallet = this.client.open(
      JettonWallet.create(jettonWalletAddress)
    );

    /* Convert amount using correct decimals */
    const multiplier = BigInt(10 ** jettonDecimals);
    const requiredAmount = BigInt(
      Math.floor(parseFloat(jettonAmount) * Number(multiplier))
    );

    /* Check if wallet has jetton balance */
    const jettonBalance = await jettonWallet.getBalance();

    if (jettonBalance < requiredAmount) {
      const currentBalanceFormatted = (
        Number(jettonBalance) / Number(multiplier)
      ).toString();
      throw new Error(
        `Insufficient jetton balance. Required: ${jettonAmount}, Available: ${currentBalanceFormatted}`
      );
    }

    /* Check if wallet has sufficient TON for gas fees */
    const currentBalance = await this.client.getBalance(this.wallet!.address);
    const jettonGasEstimate =
      toNano("0.037"); /* Higher gas estimate for jetton transfers */

    if (currentBalance < jettonGasEstimate) {
      throw new Error(
        `Insufficient TON balance for gas fees. Required: ${fromNano(
          jettonGasEstimate
        )} TON, Available: ${fromNano(currentBalance)} TON`
      );
    }

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32) /* transfer op */
      .storeUint(0, 64) /* query_id */
      .storeCoins(requiredAmount) /* amount */
      .storeAddress(Address.parse(recipientAddress)) /* destination */
      .storeAddress(this.wallet!.contract.address) /* response_destination */
      .storeBit(false) /* no custom_payload */
      .storeCoins(toNano("0.02")) /* forward_amount */
      .storeBit(false) /* no forward_payload */
      .endCell();

    const seqno = await this.wallet!.contract.getSeqno();

    let transfer;

    if (this.isWalletV4(this.wallet!.contract)) {
      transfer = await this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode:
          SendMode.PAY_GAS_SEPARATELY /* Remove IGNORE_ERRORS to catch failures */,
        messages: [
          internal({
            to: jettonWallet.address,
            value:
              toNano("0.06") /* Increased gas amount for jetton transfers */,
            bounce: false /* Set bounce to false */,
            body,
          }),
        ],
      });
    } else if (this.isWalletV5(this.wallet!.contract)) {
      transfer = this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode:
          SendMode.PAY_GAS_SEPARATELY /* Remove IGNORE_ERRORS to catch failures */,
        messages: [
          internal({
            to: jettonWallet.address,
            value:
              toNano("0.06") /* Increased gas amount for jetton transfers */,
            bounce: false /* Set bounce to false */,
            body,
          }),
        ],
      });
    } else {
      throw new Error("Unsupported wallet version");
    }

    /* Send the transaction */
    await this.client.sendExternalMessage(this.wallet!.contract, transfer);

    /* Wait for transaction confirmation and get the hash */
    const txHash = await this.waitForTransaction(seqno);

    return {
      from: this.wallet!.address.toString(),
      to: recipientAddress,
      amount: jettonAmount,
      token: jettonMasterAddress,
      txHash,
    };
  }
}

interface TONParcelConfig {
  apiKey: string;
}

class TONParcel implements Parcel {
  private sharedClient: TonClient;
  private apiClient: TonApiClient;
  private mainnet: boolean;
  private config: TONParcelConfig;
  private mode: "single" | "batch";

  constructor({
    mainnet = false,
    config,
    mode = "single",
  }: ParcelParams & {
    config: TONParcelConfig;
  }) {
    this.mainnet = mainnet;
    this.config = config;
    this.mode = mode;
    this.sharedClient = new TonClient({
      endpoint: mainnet ? TON_MAINNET_RPC : TON_TESTNET_RPC,
      apiKey: this.config.apiKey
        ? this.config.apiKey
        : mainnet
        ? import.meta.env.VITE_TON_MAINNET_API_KEY
        : import.meta.env.VITE_TON_TESTNET_API_KEY,
    });
    this.apiClient = new TonApiClient(mainnet);
  }

  private createWallet(seedPhrase: string, version: 4 | 5 = 5): TONWallet {
    return new TONWallet({
      seedPhrase,
      version,
      client: this.sharedClient,
      mainnet: this.mainnet,
      apiKey: this.config.apiKey,
    });
  }

  async split({
    wallet,
    addresses,
    token,
    amount,
  }: {
    wallet: Wallet;
    addresses: string[];
    token: Token;
    amount: string;
  }): Promise<TransactionResult[]> {
    const perAddressAmount = (parseFloat(amount) / addresses.length).toFixed(9);

    /* Extract mnemonic from wallet (could be in mnemonic or privateKey field) */
    const seedPhrase = wallet.mnemonic || wallet.privateKey;
    if (!seedPhrase) {
      throw new Error(
        "Wallet must have mnemonic or privateKey for TON operations"
      );
    }

    const tonWallet = this.createWallet(
      seedPhrase,
      wallet.version as 4 | 5
    ); /* Default to v5 */

    let jettonDecimals = 9;

    if (token.address) {
      /* Get jetton decimals from TON API */
      const jettonInfo = await this.apiClient.getJettonInfo(token.address);
      jettonDecimals = jettonInfo.decimals;
    }

    const results: TransactionResult[] = [];
    for (const address of addresses) {
      try {
        let result;
        if (!token.address) {
          /* Native TON transfer */
          result = await tonWallet.transferNativeTon(
            address,
            perAddressAmount,
            false
          );
        } else {
          /* Jetton transfer */
          result = await tonWallet.transferJetton(
            token.address,
            jettonDecimals,
            address,
            perAddressAmount
          );
        }

        results.push({
          status: true,
          to: result.to,
          txHash: result.txHash,
        });
      } catch (error) {
        results.push({
          status: false,
          to: address,
          txHash: "",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async merge({
    senders,
    receiver,
    token,
    amount,
  }: {
    senders: Wallet[];
    receiver: string;
    token: Token;
    amount?: string;
  }): Promise<TransactionResult[]> {
    let jettonDecimals = 9;

    if (token.address) {
      /* Get jetton decimals from TON API */
      const jettonInfo = await this.apiClient.getJettonInfo(token.address);
      jettonDecimals = jettonInfo.decimals;
    }

    /* Define transfer callback function */
    const transferCallback = async (wallet: Wallet) => {
      /* Extract mnemonic from wallet (could be in mnemonic or privateKey field) */
      const seedPhrase = wallet.mnemonic || wallet.privateKey;
      if (!seedPhrase) {
        return {
          status: false,
          to: receiver,
          txHash: "",
          error: "Wallet must have mnemonic or privateKey for TON operations",
        };
      }

      const tonWallet = this.createWallet(
        seedPhrase,
        wallet.version as 4 | 5
      ); /* Default to v5 */

      try {
        let result;

        if (!token.address) {
          let transferAmount = amount;

          if (!transferAmount) {
            /* If amount not specified, transfer entire balance minus gas */
            const balance = await tonWallet.getNativeTonBalance();
            const balanceNano = toNano(balance);
            const gasEstimate = toNano("0.0055");
            if (balanceNano <= gasEstimate) {
              throw new Error("Insufficient balance to cover gas fees");
            }
            transferAmount = fromNano(balanceNano - gasEstimate);
          }

          /* Native TON transfer */
          result = await tonWallet.transferNativeTon(
            receiver,
            transferAmount,
            !amount /* Include gas if amount not specified */
          );
        } else {
          let transferAmount = amount;

          if (!transferAmount) {
            /* If amount not specified, transfer entire jetton balance */
            const balance = await tonWallet.getJettonBalance(
              token.address,
              jettonDecimals
            );
            transferAmount = balance;
          }

          /* Jetton transfer */
          result = await tonWallet.transferJetton(
            token.address,
            jettonDecimals,
            receiver,
            transferAmount
          );
        }

        return {
          status: true,
          to: result.to,
          txHash: result.txHash,
        };
      } catch (error) {
        return {
          status: false,
          to: receiver,
          txHash: "",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    };

    if (this.mode === "single") {
      const results: TransactionResult[] = [];
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

  async generateTestMnemonic() {
    const mnemonic = await mnemonicNew();
    console.log("Your NEW Testnet Mnemonic (SAVE THIS!):");
    console.log(mnemonic.join(" "));

    const tonWallet = new TONWallet({
      seedPhrase: mnemonic.join(" "),
      mainnet: false,
      version: 4,
      client: this.sharedClient,
    });
    const wallet = await tonWallet.initWallet();
    console.log("Your Testnet Wallet Address:");
    console.log(wallet.address.toString());

    return wallet.address.toString();
  }
}

export { TONParcel, TONWallet, TonApiClient };
