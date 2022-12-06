import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Binance from "../../sdk/binance";
import { ISaleEntity } from "../../sdk/Interfaces";
import getPaymentData from "../../sdk/utils/getPaymentData";

class Element {
    name: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "element-bsc-2";
        this.protocol = "binance-smart-chain";
        this.block = 22357101;
        this.contract = "0xb3e3dfcb2d9f3dde16d78b9e6eb3538eb32b5ae1";
        this.events = ["ERC721SellOrderFilled", "ERC721BuyOrderFilled"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Binance(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (event: EventData): string => {
        let token = event.returnValues["erc20Token"].toLowerCase();

        if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
            token = "bnb";
        }

        return token;
    };

    process = async (event: EventData): Promise<void> => {
        const isSellOrder = "ERC721SellOrderFilled" === event.event;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const paymentToken = this._getToken(event);
        const nativePrice = event.returnValues["erc20TokenAmount"];
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const buyer = isSellOrder ? taker : maker;
        const seller = isSellOrder ? maker : taker;
        const nftContract = event.returnValues["erc721Token"] || event.returnValues["erc1155Token"];
        const tokenId = event.returnValues["erc721TokenId"] || event.returnValues["erc1155TokenId"];
        const { paymentTokenSymbol, priceInCrypto, priceInUsd } = await getPaymentData(
            this.protocol,
            paymentToken,
            nativePrice,
            timestamp,
        );

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: paymentToken,
            tokenSymbol: paymentTokenSymbol,
            amount: 1,
            price: priceInCrypto,
            priceUsd: priceInUsd,
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

export default Element;
