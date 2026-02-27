import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import { ISaleEntity } from "../../sdk/Interfaces";
import BasicProvider, { IBasicProviderOptions } from "../../sdk/basic-provider";
enum ItemType {
    NATIVE = 0,
    ERC20 = 1,
    ERC721 = 2,
    ERC1155 = 3,
}

type TradeItem = {
    itemType: ItemType;
    token: string;
    identifier: BigNumber;
    amount: BigNumber;
};

class Mooar extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["OrderFulfilled"];
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const offerer = event.returnValues.offerer;
        const recipient = event.returnValues.recipient;
        const offerRaw = event.returnValues.offer;
        const considerationRaw = event.returnValues.consideration;

        const offer: TradeItem[] = this.toTradeItems(offerRaw);
        const consideration: TradeItem[] = this.toTradeItems(considerationRaw);

        if (offerer.toLowerCase() === recipient.toLowerCase()) {
            return;
        }
        if (consideration.length === 0) {
            return;
        }
        const offerNft = offer.find(item => item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155);
        const considerationNft = consideration.find(
            item => item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155,
        );
        if (offerNft !== undefined && considerationNft !== undefined) {
            if (
                offerNft.token !== considerationNft.token ||
                offerNft.identifier.toString() !== considerationNft.identifier.toString()
            ) {
                return;
            }
        } else if (offerNft === undefined && considerationNft === undefined) {
            return;
        }
        const isOfferNft = offerNft !== undefined;
        let nft: {
            id: string;
            amount: number;
            contract: string;
        } | null;
        let tradePrice: {
            token: string;
            price: BigNumber;
        } | null;
        if (isOfferNft) {
            nft = this.getNft(offer);
            tradePrice = this.getTradePrice(consideration);
        } else {
            nft = this.getNft(consideration);
            tradePrice = this.getTradePrice(offer);
        }
        if (nft === null || tradePrice === null) {
            return;
        }
        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            chainId: this.sdk.chainId,
            nfts: [nft],
            token: tradePrice.token,
            price: tradePrice.price,
            seller: isOfferNft ? offerer.toLowerCase() : recipient.toLowerCase(),
            buyer: isOfferNft ? recipient.toLowerCase() : offerer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        return this.addToDatabase(entity);
    };
    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };

    private toTradeItems(rawValue: string[][]): TradeItem[] {
        return rawValue.map(item => {
            return {
                itemType: Number(item[0]),
                token: item[1].toLowerCase(),
                identifier: new BigNumber(item[2]),
                amount: new BigNumber(item[3]),
            };
        });
    }

    private getNft(
        items: TradeItem[],
    ): {
        contract: string;
        id: string;
        amount: number;
    } | null {
        const nftItems = items.filter(item => item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155);
        if (nftItems.length != 1) {
            return null;
        }
        const nftItem = nftItems[0];
        const n = Number(nftItem.amount.toString());
        if (isNaN(n)) {
            return null;
        }
        return {
            contract: nftItem.token,
            id: nftItem.identifier.toString(),
            amount: n,
        };
    }

    private getTradePrice(
        items: TradeItem[],
    ): {
        token: string;
        price: BigNumber;
    } | null {
        const nftItems = items.filter(item => item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20);
        if (nftItems.length === 0) {
            return null;
        }
        let token = nftItems[0].token;
        let price = new BigNumber(0);

        for (const nftItem of nftItems) {
            if (nftItem.token === token) {
                price = price.plus(nftItem.amount);
            }
        }
        if (token === "0x0000000000000000000000000000000000000000") {
            token = this.defaultPaymentToken;
        }
        return {
            token,
            price,
        };
    }
}

export default Mooar;
