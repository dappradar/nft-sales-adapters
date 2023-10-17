import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class NFTKey extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["TokenBought", "TokenBidAccepted"];
    }

    private getBuyer = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.bid.bidder;
        }

        return event.returnValues.buyer;
    };

    private getPaymentToken = async (event: EventData): Promise<string> => {
        if (event.event === "TokenBidAccepted") {
            const paymentTokenCall = await this.sdk.callContractMethod("paymentToken");

            return paymentTokenCall.toLowerCase();
        }

        return this.defaultPaymentToken;
    };

    private getPrice = (event: EventData): BigNumber => {
        let value: number;

        if (event.event === "TokenBidAccepted") {
            value = event.returnValues.bid.value;
        } else {
            value = event.returnValues.listing.value;
        }

        return new BigNumber(value);
    };

    private getSeller = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.seller;
        }

        return event.returnValues.listing.seller;
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        const paymentToken = await this.getPaymentToken(event);
        const price = this.getPrice(event);
        const seller = this.getSeller(event);

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: event.returnValues.erc721Address.toLowerCase(),
                    id: event.returnValues.tokenId,
                    amount: 1,
                },
            ],
            token: paymentToken,
            price,
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default NFTKey;
