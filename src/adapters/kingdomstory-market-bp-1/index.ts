import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

// event NewSale(
//     address indexed seller,
//     address indexed buyer,
//     uint256 indexed tokenId,
//     uint256 totalPricePaid,
//     address currencyContract,
//     address nftContract,
//     uint256 tradeId
// );

class KingdomStoryMarket extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);
        this.requireDefaultPaymentToken();
        this.events = ["NewSale"];
    }

    private getToken = (event: EventData): string => {
        let token = event.returnValues["currencyContract"].toLowerCase();

        // bnb
        if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
            token = this.defaultPaymentToken;
        }

        return token;
    };

    process = async (event: EventData): Promise<ISaleEntity> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        // const nftContract = await this.sdk.callContractMethod("nftContract", [], undefined, event.blockNumber);
        const nftContract = event.returnValues.nftContract;

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
            token: this.getToken(event),
            price: new BigNumber(event.returnValues.totalPricePaid),
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

export default KingdomStoryMarket;
