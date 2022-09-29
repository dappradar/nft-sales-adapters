import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import priceSdk from "../../sdk/price";
import Ethereum from "../../sdk/EVMC";
import symbolSdk from "../../sdk/symbol";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

class Element {
    name: string;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "element";
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 15080677;
        this.contract = "0x20f780a973856b93f63670377900c1d2a50a77c4";
        this.events = [
            "ERC721SellOrderFilled",
            "ERC721BuyOrderFilled",
            "ERC1155SellOrderFilled",
            "ERC1155BuyOrderFilled",
        ];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Ethereum(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (event: EventData): string => {
        let token = event.returnValues["erc20Token"].toLowerCase();

        if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
            token = "0x0000000000000000000000000000000000000000";
        }

        return token;
    };

    process = async (event: EventData): Promise<void> => {
        const isER721 = event.event === "ERC721SellOrderFilled" || event.event === "ERC721BuyOrderFilled";
        const isSellOrder = ["ERC721SellOrderFilled", "ERC1155SellOrderFilled"].includes(event.event);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const token = this._getToken(event);
        const symbol: ISymbolAPIResponse = await symbolSdk.get(token, this.protocol);
        const po = await priceSdk.get(token, this.protocol, block.timestamp);
        const amount = isER721 ? 1 : event.returnValues["erc1155FillAmount"];
        const price = isER721 ? event.returnValues["erc20TokenAmount"] : event.returnValues["erc20FillAmount"];
        const nativePrice = new BigNumber(price).dividedBy(10 ** (symbol?.decimals || 0));
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const buyer = isSellOrder ? taker : maker;
        const seller = isSellOrder ? maker : taker;
        const nft_contract = event.returnValues["erc721Token"] || event.returnValues["erc1155Token"];
        const tokenId = event.returnValues["erc721TokenId"] || event.returnValues["erc1155TokenId"];

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nft_contract.toLowerCase(),
            nftId: tokenId,
            token: token.toLowerCase(),
            tokenSymbol: symbol?.symbol || "",
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
        console.log(`creating sale for ${entity.nftContract} with id ${entity.nftId}`);
        return entity;
    };
}

export default new Element();
