import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Bazaar extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["PurchasedListing"];
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const seller = event.returnValues.seller.toLowerCase();
        const buyer = event.returnValues.buyer.toLowerCase();

        if (buyer === seller) {
            return;
        }

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: event.returnValues.nftAddress.toLowerCase(),
                    id: event.returnValues.nftID,
                    amount: 1,
                },
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(event.returnValues.price),
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

export default Bazaar;
