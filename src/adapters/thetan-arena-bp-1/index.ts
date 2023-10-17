import moment from "moment";
import BigNumber from "bignumber.js";
import {EventData} from "web3-eth-contract";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class ThetanArena extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        this.events = ["MatchTransaction"];
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: event.returnValues.contractAddress.toLowerCase(),
                    id: event.returnValues.tokenId,
                    amount: 1,
                }
            ],
            token: event.returnValues.paymentToken.toLowerCase(),
            price: new BigNumber(event.returnValues.price),
            seller: event.returnValues.seller.toLowerCase(),
            buyer: event.returnValues.buyer.toLowerCase(),
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

export default ThetanArena;
