import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BigNumber from "bignumber.js";
import moment from "moment";
import {TransactionReceipt, Log} from "web3-core";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

interface IAuctionInformation {
    price: BigNumber;
    nftContract: string;
    nftId: string;
    seller: string;
    buyer: string;
}

interface ITransfer {
    to: string;
    from: string;
    value: string;
}

class XCAD extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["AuctionSettled"];
    }

    private getNFTTransferEvent = (log: Log): ITransfer => {
        return {
            from: new BigNumber(log.topics[1]).toString(16),
            to: new BigNumber(log.topics[2]).toString(16),
            value: new BigNumber(log.topics[3]).toString(),
        };
    };

    private getTransferEvent = (log: Log): ITransfer => {
        return {
            from: new BigNumber(log.topics[1]).toString(16),
            to: new BigNumber(log.topics[2]).toString(16),
            value: new BigNumber(log.data).toString(),
        };
    };

    private getAuctionInformation = async (event: EventData): Promise<IAuctionInformation | undefined> => {
        const txReceipt: TransactionReceipt | null = await this.sdk.getTransactionReceipt(event.transactionHash);

        if (!txReceipt) {
            return;
        }

        const transferLogs = txReceipt.logs.filter(
            log => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        );

        // Validate Correct Transaction Logs
        if (!transferLogs.length || transferLogs.length !== 3) {
            return;
        }

        const nftTransfer = this.getNFTTransferEvent(transferLogs[0]);
        const userTransfer = this.getTransferEvent(transferLogs[1]);
        const treasuryTransfer = this.getTransferEvent(transferLogs[2]);
        const price = new BigNumber(userTransfer.value).plus(treasuryTransfer.value);

        return {
            price,
            nftContract: transferLogs[0].address.toLowerCase(),
            nftId: nftTransfer.value,
            seller: `0x${userTransfer.to.toLowerCase()}`,
            buyer: `0x${nftTransfer.to.toLowerCase()}`,
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const auctionInformation = await this.getAuctionInformation(event);

        if (!auctionInformation) {
            return;
        }

        const {price, nftContract, nftId, seller, buyer} = auctionInformation;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nftContract,
                    id: nftId,
                    amount: 1
                },
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(price),
            seller,
            buyer,
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default XCAD;
