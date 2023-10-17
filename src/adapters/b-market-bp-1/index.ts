import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class BMarket extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        this.events = ["Sold"];
    }

    process = async (event: EventData): Promise<ISaleEntity> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const token = await this.sdk.callContractMethod("bcoinContract", [], undefined, event.blockNumber);

        if (!token) {
            throw new Error(`Failed to fetch token address for transaction "${event.transactionHash}". Provider - "${this.name}"`);
        }

        const nftContract = await this.sdk.callContractMethod("nftContract", [], undefined, event.blockNumber);

        if (!nftContract) {
            throw new Error(`Failed to fetch NFT contract address for transaction "${event.transactionHash}". Provider - "${this.name}"`);
        }

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [{
                contract: nftContract.toLowerCase(),
                id: event.returnValues.tokenId,
                amount: 1
            }],
            token: token.toLowerCase(),
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

export default BMarket;
