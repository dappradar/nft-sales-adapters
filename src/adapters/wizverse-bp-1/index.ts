import moment from "moment";
import BigNumber from "bignumber.js";
import { EventData } from "web3-eth-contract";
import { Log, TransactionReceipt } from "web3-core";
import BasicProvider, { IBasicProviderOptions } from "../../sdk/basic-provider";
import { ISaleEntity } from "../../sdk/Interfaces";

// ERC20/721 Transfer topic
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

class Wizverse extends BasicProvider {
    // USDC token address on SKALE is expected to be provided via config as defaultPaymentToken
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["Transfer"]; // ERC-721 Transfer
    }

    private topicToAddress = (topic: string): string => {
        // topics for indexed address are 32-byte left-padded; take last 40 hex chars
        return ("0x" + topic.slice(-40)).toLowerCase();
    };

    private getUsdcTransfersFromBuyer = (
        receipt: TransactionReceipt,
        buyer: string,
        usdcAddress: string,
    ): BigNumber => {
        let total = new BigNumber(0);
        const addressLc = usdcAddress.toLowerCase();
        const buyerLc = buyer.toLowerCase();

        for (const log of receipt.logs as Log[]) {
            if (log.address.toLowerCase() !== addressLc) continue;
            if (log.topics[0] !== TRANSFER_TOPIC) continue;
            const from = this.topicToAddress(log.topics[1]);
            if (from !== buyerLc) continue;
            // "data" holds the value for ERC20 Transfer
            const value = new BigNumber(log.data);
            total = total.plus(value);
        }
        return total;
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        let from = event.returnValues.from.toLowerCase();
        const to = event.returnValues.to.toLowerCase();
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.address.toLowerCase();

        // Skip burns
        if (to === "0x0000000000000000000000000000000000000000") {
            return;
        }

        if (from === "0x0000000000000000000000000000000000000000") {
            from = nftContract;
        }

        // Fetch tx receipt to inspect ERC20 transfers (USDC)
        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
        if (!txReceipt) return;

        const usdcAddress = this.defaultPaymentToken.toLowerCase();
        const totalPaidByBuyer = this.getUsdcTransfersFromBuyer(txReceipt, to, usdcAddress);

        // If no USDC moved from buyer in this tx, treat as non-sale transfer
        if (totalPaidByBuyer.isZero()) {
            return;
        }

        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            chainId: this.sdk.chainId,
            nfts: [
                {
                    contract: nftContract,
                    id: tokenId,
                    amount: 1,
                },
            ],
            token: usdcAddress,
            price: totalPaidByBuyer,
            seller: from,
            buyer: to,
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Wizverse;


