import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Matic from "../../sdk/matic";
import { ISaleEntity } from "../../sdk/Interfaces";
import getPaymentData from "../../sdk/utils/getPaymentData";

class GlExchange {
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
        this.name = "glexchange-polygon-1";
        this.protocol = "matic";
        this.token = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
        this.block = 34825626;
        this.contract = "0x8013bf7e0278891fb82b26fbd56628e12fed112a";
        this.events = ["OrderExecuted"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Matic(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    process = async (event: EventData): Promise<void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const amount = event.returnValues["supply"];
        const seller = event.returnValues["seller"];
        const buyer = event.returnValues["buyer"];
        const nftContract = event.returnValues["nftAddress"];
        const tokenId = event.returnValues["tokenId"];
        const { paymentTokenSymbol, priceInCrypto, priceInUsd } = await getPaymentData(
            this.protocol,
            this.token,
            event.returnValues.price,
            timestamp,
        );

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: this.token,
            tokenSymbol: paymentTokenSymbol,
            amount,
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

export default GlExchange;
