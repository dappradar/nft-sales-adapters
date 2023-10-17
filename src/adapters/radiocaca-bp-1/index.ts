import moment from "moment";
import BigNumber from "bignumber.js";
import {EventData} from "web3-eth-contract";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class RadioCaca extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        this.events = ["AuctionExecuted"];
    }

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const auctionInfo = await this.sdk.callContractMethod("auctions", [event.returnValues.auctionId], undefined, event.blockNumber);

        if (Number(auctionInfo.status) === 0) {
            return;
        }

        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: event.returnValues.nftAddress.toLowerCase(),
                    id: event.returnValues.tokenId,
                    amount: auctionInfo.count,
                },
            ],
            token: auctionInfo.paymentToken.toLowerCase(),
            price: new BigNumber(event.returnValues.bid),
            seller: auctionInfo.seller.toLowerCase(),
            buyer: event.returnValues.bidder.toLowerCase(),
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

export default RadioCaca;
