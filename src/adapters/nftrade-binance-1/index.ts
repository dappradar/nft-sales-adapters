import * as dotenv from "dotenv";
import { EventData } from "web3-eth-contract";
import moment from "moment";
import path from "path";
import BigNumber from "bignumber.js";

dotenv.config();

import { ISymbolAPIResponse, ISaleEntity } from "../../sdk/Interfaces";
import BSC from "../../sdk/binance";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const ERC20ProxyId = "0xf47261b0";
const ERC721ProxyId = "0x02571792";
const ERC1155ProxyId = "0xa7cb5fb7";

class NFTRADE {
    name: string;
    symbol: ISymbolAPIResponse | undefined;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;
    constructor() {
        this.name = "nftrade-binance-1";
        this.symbol = undefined;
        this.token = "bnb";
        this.protocol = "binance-smart-chain";
        this.block = 21416323;
        this.contract = "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3";
        this.events = ["Fill"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new BSC(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getAssetProxyId = (assetData: string) => {
        return assetData.slice(0, 10);
    };

    isOffer = (assetData: string) => {
        return this.getAssetProxyId(assetData) === ERC20ProxyId;
    };

    getAssetDataAddress = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(["address"], assetData.slice(10));
        return data["0"];
    };

    decodeERC721AssetData = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(["address", "uint256"], assetData.slice(10));
        const address = data["0"];
        const id = data["1"];
        return { address, id };
    };

    decodeERC1155AssetData = (assetData: string) => {
        const data = this.sdk.web3.eth.abi.decodeParameters(
            ["address", "uint256[]", "uint256[]", "bytes"],
            assetData.slice(10),
        );
        const address = data["0"];
        const id = data["1"][0];
        return { address, id };
    };

    getNFTData = (assetData: string) => {
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
        const amount = 1;
        const price = event.returnValues[isOffer ? "makerAssetAmount" : "takerAssetAmount"];
        const maker = event.returnValues["makerAddress"];
        const taker = event.returnValues["takerAddress"];
        const buyer = isOffer ? maker : taker;
        const seller = isOffer ? taker : maker;
        let token = this.getAssetDataAddress(event.returnValues[isOffer ? "makerAssetData" : "takerAssetData"]);
        if (ADDRESS_ZERO === token) {
            token = this.token;
        }
        const po = await priceSdk.get(token, this.protocol, +block.timestamp);
        const symbol = await symbolSdk.get(token, this.protocol);
        const nativePrice = new BigNumber(price).dividedBy(10 ** symbol.decimals);
        const entity = {
            providerName: this.name, // the name of the folder
            providerContract: this.contract.toLowerCase(), // the providers contract from which you get data
            protocol: this.protocol,
            nftContract: nft.address.toLowerCase(),
            nftId: String(nft.id),
            token: token.toLowerCase(),
            tokenSymbol: symbol.symbol,
            amount,
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };
        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        console.log(entity.blockNumber);
        return entity;
    };
}

export default NFTRADE;
