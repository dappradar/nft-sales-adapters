import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import BSC from "../../sdk/binance";
import path from "path";

import { ISaleEntity } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";
import getPaymentData from "../../sdk/utils/getPaymentData";

class BHeroMarket {
    name: string;
    token: string | undefined;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "bhero-market";
        this.token = undefined;
        this.protocol = "binance-smart-chain";
        this.block = 15498601;
        this.contract = "0x376a10e7f125a4e0a567cc08043c695cd8edd704";
        this.events = ["Sold"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async () => {
        this.sdk = await this.loadSdk();

        const token = await this.sdk.callContractMethod("bcoinContract");
        if (!token) throw new Error("Failed to fetch token address");
        this.token = token.toLowerCase();

        await this.sdk.run();
    };

    loadSdk = () => {
        return new BSC(this);
    };

    stop = async () => {
        this.sdk.stop();
    };

    getBuyer = (event: EventData): string | null => {
        return event.returnValues.buyer;
    };

    getSeller = (event: EventData): string | null => {
        return event.returnValues.seller;
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        if (!this.token) {
            throw new Error("Missing payment token");
        }

        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        if (!buyer) {
            return;
        }
        const tokenId = event.returnValues.tokenId;
        const seller = this.getSeller(event) || "";
        const nftContract = await this.sdk.callContractMethod("nftContract");
        const { paymentTokenSymbol, priceInCrypto, priceInUsd } = await getPaymentData(
            this.protocol,
            this.token,
            event.returnValues.price,
            timestamp,
        );

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: this.token,
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
        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default BHeroMarket;
