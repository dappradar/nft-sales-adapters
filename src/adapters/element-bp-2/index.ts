import BigNumber from "bignumber.js";
import moment from "moment";
import {EventData} from "web3-eth-contract";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Element extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["ERC721SellOrderFilled", "ERC721BuyOrderFilled"];
    }

    private getToken = (event: EventData): string => {
        let token = event.returnValues["erc20Token"].toLowerCase();

        if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
            token = this.defaultPaymentToken;
        }

        return token;
    };

    process = async (event: EventData): Promise<void> => {
        const isSellOrder = "ERC721SellOrderFilled" === event.event;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const price = event.returnValues["erc20TokenAmount"];
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const buyer = isSellOrder ? taker : maker;
        const seller = isSellOrder ? maker : taker;
        const nftContract = event.returnValues["erc721Token"] || event.returnValues["erc1155Token"];
        const tokenId = event.returnValues["erc721TokenId"] || event.returnValues["erc1155TokenId"];

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nftContract.toLowerCase(),
                    id: tokenId,
                    amount: 1
                }
            ],
            token: this.getToken(event),
            price: new BigNumber(price),
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

export default Element;
