import moment from "moment";
import { EventData } from "web3-eth-contract";
import { ISaleEntity } from "../../sdk/Interfaces";
import BasicProvider, { IBasicProviderOptions } from "../../sdk/basic-provider";
import BigNumber from "bignumber.js";

class ArenaGames extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["ListingBoughtFull"];
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.collection.toLowerCase();
        const price = event.returnValues.price;
        const paymentToken = event.returnValues.paymentToken.toLowerCase();

        const entity = {
            providerName: this.name,
            providerContract: this.contract.toLowerCase(),
            chainId: this.sdk.chainId,
            nfts: [
                {
                    id: tokenId,
                    amount: 1,
                    contract: nftContract.toLowerCase(),
                },
            ],
            token: paymentToken,
            price: new BigNumber(price),
            seller: event.returnValues.seller.toLowerCase(),
            buyer: event.returnValues.buyer.toLowerCase(),
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

export default ArenaGames;
