import {EventData} from "web3-eth-contract";
import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const ERC20ProxyId = "0xf47261b0";
const ERC721ProxyId = "0x02571792";
const ERC1155ProxyId = "0xa7cb5fb7";

class NFTRADE extends BasicProvider {
    constructor(options: IBasicProviderOptions) {
        super(options);

        if (!this.defaultPaymentToken) {
            throw new Error(`Missing default payment token for provider "${this.name}"`);
        }

        this.events = ["Fill"];
    }

    private getAssetProxyId = (assetData: string) => {
        return assetData.slice(0, 10);
    };

    private isOffer = (assetData: string) => {
        return this.getAssetProxyId(assetData) === ERC20ProxyId;
    };

    private getAssetDataAddress = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(["address"], assetData.slice(10));
        return data["0"];
    };

    private decodeERC721AssetData = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(["address", "uint256"], assetData.slice(10));
        const address = data["0"];
        const id = data["1"];
        return {address, id};
    };

    private decodeERC1155AssetData = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(
            ["address", "uint256[]", "uint256[]", "bytes"],
            assetData.slice(10),
        );
        const address = data["0"];
        const id = data["1"][0];
        return {address, id};
    };

    private getNFTData = (assetData: string) => {
        const assetProxyId = this.getAssetProxyId(assetData);

        if (assetProxyId == ERC721ProxyId) return this.decodeERC721AssetData(assetData);
        else if (assetProxyId == ERC1155ProxyId) return this.decodeERC1155AssetData(assetData);

        return {
            address: ADDRESS_ZERO,
            id: 0,
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const isOffer = this.isOffer(event.returnValues["makerAssetData"]);
        const nft = this.getNFTData(event.returnValues[isOffer ? "takerAssetData" : "makerAssetData"]);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const price = event.returnValues[isOffer ? "makerAssetAmount" : "takerAssetAmount"];
        const maker = event.returnValues["makerAddress"];
        const taker = event.returnValues["takerAddress"];
        const buyer = isOffer ? maker : taker;
        const seller = isOffer ? taker : maker;
        let token = this.getAssetDataAddress(event.returnValues[isOffer ? "makerAssetData" : "takerAssetData"]);
        if (ADDRESS_ZERO === token) {
            token = this.defaultPaymentToken;
        }

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nft.address.toLowerCase(),
                    id: String(nft.id),
                    amount: 1
                }
            ],
            token: token.toLowerCase(),
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
        console.log(entity.blockNumber);
        return entity;
    };
}

export default NFTRADE;
