import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import {TransactionReceipt} from "web3-core";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

// ENS stands for Ethereum Name Service
class ENS extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["NameRegistered", "NameRenewed"];
    }

    getBuyer = async (event: EventData): Promise<string | null> => {
        if (event.event === "NameRenewed") {
            const txReceipt: TransactionReceipt | null = await this.sdk.getTransactionReceipt(event.transactionHash);

            if (txReceipt === null) {
                return null;
            }

            return txReceipt.from.toLowerCase();
        }

        return event.returnValues.owner.toLowerCase();
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = await this.getBuyer(event);

        if (!buyer) {
            return;
        }

        const nftId = new BigNumber(event.returnValues.label, 16).toFixed();

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: this.contract,
                    id: nftId,
                    amount: 1,
                },
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(event.returnValues.cost),
            seller: this.contract,
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

export default ENS;
