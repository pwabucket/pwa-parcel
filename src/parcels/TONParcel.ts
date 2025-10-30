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
import type { Parcel, Wallet, Token, TransactionResult } from "../types";

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
    client /* Optional shared client */,
  }: {
    seedPhrase: string;
    mainnet?: boolean;
    version?: 4 | 5;
    client?: TonClient;
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
            { limit: 5 }
          );

          /* Find the transaction with the expected seqno */
          for (const tx of transactions) {
            if (
              tx.inMessage?.info.src === null &&
              tx.description.type === "generic"
            ) {
              /* This is likely our outgoing transaction */
              return tx.hash().toString("hex");
            }
          }

          /* If we can't find the specific transaction, return the latest transaction hash */
          if (transactions.length > 0) {
            return transactions[0].hash().toString("hex");
          }
        }

        /* Wait before next check */
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn("Error checking transaction status:", error);
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

  async transferNativeTon(recipientAddress: string, amountTon: string) {
    await this.initWallet();

    const recipient = Address.parse(recipientAddress);
    const amountNano = toNano(amountTon);
    const seqno = await this.wallet!.contract.getSeqno();

    let transfer;

    if (this.isWalletV4(this.wallet!.contract)) {
      transfer = await this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
          internal({ to: recipient, value: amountNano, bounce: true }),
        ],
      });
    } else if (this.isWalletV5(this.wallet!.contract)) {
      transfer = this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
          internal({ to: recipient, value: amountNano, bounce: true }),
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

  async getJettonBalance(jettonMasterAddress: string): Promise<string> {
    await this.initWallet();

    try {
      const master = this.client.open(
        JettonMaster.create(Address.parse(jettonMasterAddress))
      );
      const walletAddress = await master.getWalletAddress(
        this.wallet!.contract.address
      );
      const jettonWallet = this.client.open(JettonWallet.create(walletAddress));
      const bal = await jettonWallet.getBalance();
      return fromNano(bal);
    } catch {
      return "0";
    }
  }

  async transferJetton(
    jettonMasterAddress: string,
    recipientAddress: string,
    jettonAmount: string
  ) {
    await this.initWallet();

    const master = this.client.open(
      JettonMaster.create(Address.parse(jettonMasterAddress))
    );

    const jettonWalletAddress = await master.getWalletAddress(
      this.wallet!.contract.address
    );

    const jettonWallet = this.client.open(
      JettonWallet.create(jettonWalletAddress)
    );

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32) /* transfer op */
      .storeUint(0, 64)
      .storeCoins(toNano(jettonAmount))
      .storeAddress(Address.parse(recipientAddress))
      .storeAddress(this.wallet!.contract.address)
      .storeBit(false) /* no custom payload */
      .storeCoins(toNano("0.01")) /* forward amount */
      .storeBit(false)
      .endCell();

    const seqno = await this.wallet!.contract.getSeqno();

    let transfer;

    if (this.isWalletV4(this.wallet!.contract)) {
      transfer = await this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
          internal({
            to: jettonWallet.address,
            value: toNano("0.05"),
            bounce: true,
            body,
          }),
        ],
      });
    } else if (this.isWalletV5(this.wallet!.contract)) {
      transfer = this.wallet!.contract.createTransfer({
        seqno,
        secretKey: this.wallet!.keyPair.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
          internal({
            to: jettonWallet.address,
            value: toNano("0.05"),
            bounce: true,
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

class TONParcel implements Parcel {
  private sharedClient: TonClient;
  private mainnet: boolean;

  constructor({ mainnet = false }: { mainnet?: boolean } = {}) {
    this.mainnet = mainnet;
    this.sharedClient = new TonClient({
      endpoint: mainnet ? TON_MAINNET_RPC : TON_TESTNET_RPC,
    });
  }

  private createWallet(seedPhrase: string, version: 4 | 5 = 5): TONWallet {
    return new TONWallet({
      seedPhrase,
      version,
      client: this.sharedClient,
      mainnet: this.mainnet,
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

    const results: TransactionResult[] = [];
    for (const address of addresses) {
      try {
        let result;
        if (!token.address || token.address === "native") {
          /* Native TON transfer */
          result = await tonWallet.transferNativeTon(address, perAddressAmount);
        } else {
          /* Jetton transfer */
          result = await tonWallet.transferJetton(
            token.address,
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
    /* Create transfer promises for parallel execution */
    const transferPromises = senders.map(async (wallet) => {
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
        const transferAmount =
          amount || "0.1"; /* Default amount if not specified */

        if (!token.address || token.address === "native") {
          /* Native TON transfer */
          result = await tonWallet.transferNativeTon(receiver, transferAmount);
        } else {
          /* Jetton transfer */
          result = await tonWallet.transferJetton(
            token.address,
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
    });

    /* Execute all transfers in parallel */
    const results = await Promise.all(transferPromises);
    return results;
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

export { TONParcel, TONWallet };
