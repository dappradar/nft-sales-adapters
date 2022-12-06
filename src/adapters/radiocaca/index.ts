import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import moment from "moment";
import BSC from "../../sdk/binance";
import { EventData } from "web3-eth-contract";
import { ISaleEntity } from "../../sdk/Interfaces";
import getPaymentData from "../../sdk/utils/getPaymentData";

class RadioCaca {
    name: string;
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
        this.name = "radiocaca";
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "binance-smart-chain";
        this.block = 13219620;
        this.contract = "0xe97fdca0a3fc76b3046ae496c1502c9d8dfef6fc";
        this.events = ["AuctionExecuted"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    loadSdk = () => {
        return new BSC(this);
    };

    run = async () => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const auctionInfo = await this.sdk.callContractMethod("auctions", [event.returnValues.auctionId]);
        const status = auctionInfo[12];

        if (status === 0) return;

        const seller = auctionInfo[0];
        const count = auctionInfo[3];
        const paymentToken = auctionInfo[4].toLowerCase();
        const buyer = event.returnValues.bidder;
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.nftAddress;
        const { paymentTokenSymbol, priceInCrypto, priceInUsd } = await getPaymentData(
            this.protocol,
            paymentToken,
            event.returnValues.bid,
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
            amount: count,
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
        return entity;
    };
}

export default RadioCaca;
