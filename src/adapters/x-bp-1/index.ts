import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";
import {EventData} from "web3-eth-contract";

class X extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        this.events = [
            "0xd5a12c8e1b2b15aa8d8e98c670c585319359222157e5a1c959a59de835027b4f", // TakerBid
            "0xe1a9e4a1dd601b64511a244940f55fd6e2d1ba8846974ed476a0b6e478327bf8", // TakerAsk
            "0x782a08f6e55ce0dc0c0acae21b90c56f026e34f2693c89e7669eafc7a0546e82", // legacy TakerBid
        ];
    }

    private getSellerAndBuyer = (event: EventData): { seller: string, buyer: string } => {
        const taker = event.returnValues.taker.toLowerCase();
        const maker = event.returnValues.maker.toLowerCase();

        if (event.event === "TakerAsk") {
            return {
                seller: taker,
                buyer: maker,
            }
        }

        return {
            seller: maker,
            buyer: taker
        }
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const {seller, buyer} = this.getSellerAndBuyer(event);

        const {collection, tokenId, amount, currency, price} = event.returnValues.fulfillment;

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: collection.toLowerCase(),
                    id: tokenId,
                    amount
                }
            ],
            token: currency.toLowerCase(),
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

export default X;
