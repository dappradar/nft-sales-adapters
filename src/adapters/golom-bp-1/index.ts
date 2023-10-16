import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

interface INftData {
    contract: string;
    id: string;
}

class Golom extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["OrderFilled"];
    }

    private getNftData = async (event: EventData): Promise<undefined | INftData> => {
        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);

        if (txReceipt === null) {
            return;
        }

        for (const log of txReceipt.logs) {
            const topics = log.topics;

            if (
                topics[0] === "0x5ff9e72404463058acdc1a7367b634d29a9c3c5aa4d41dddf6321b586afb5aed" &&
                topics.length === 4
            ) {
                const nftContract = log.address.toLowerCase();
                const nftId = parseInt(topics[3], 16);

                if (!nftContract || !nftId) {
                    return;
                }

                return {
                    contract: nftContract,
                    id: nftId.toString()
                };
            }
        }

        return;
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const nftData = await this.getNftData(event);

        if (!nftData) {
            return;
        }

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nftData.contract,
                    id: nftData.id,
                    amount: 1,
                }
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(event.returnValues.price),
            seller: event.returnValues.maker.toLowerCase(),
            buyer: event.returnValues.taker.toLowerCase(),
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

export default Golom;
