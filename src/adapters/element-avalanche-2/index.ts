import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Avalanche from "../../sdk/avalanche";
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
        this.name = "element-avalanche-2";
        this.protocol = "avalanche";
        this.block = 21333894;
        this.contract = "0x18cd9270dbdca86d470cfb3be1b156241fffa9de";
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
        return new Avalanche(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (event: EventData): string => {
        let token = event.returnValues["erc20Token"].toLowerCase();

        if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
            token = "avax";
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
        const nftContract = event.returnValues["erc721Token"];
        const tokenId = event.returnValues["erc721TokenId"];
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
