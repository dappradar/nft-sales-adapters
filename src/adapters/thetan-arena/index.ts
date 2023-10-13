import * as dotenv from "dotenv";

dotenv.config();

import path from "path";
import moment from "moment";
import BSC from "../../sdk/binance";
import BigNumber from "bignumber.js";
import { EventData } from "web3-eth-contract";
import { ISaleEntity } from "../../sdk/Interfaces";

class ThetanArena {
    name: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "thetan-arena";
        this.protocol = "binance-smart-chain";
        this.block = 14551809;
        this.contract = "0x7bf5d1dec7e36d5b4e9097b48a1b9771e6c96aa4";
        this.events = ["MatchTransaction"];
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

        const buyer = event.returnValues.buyer.toLowerCase();
        const seller = event.returnValues.seller.toLowerCase();
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.contractAddress.toLowerCase();
        const paymentToken = event.returnValues.paymentToken.toLowerCase();

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract,
            nftId: tokenId,
            token: paymentToken,
            amount: 1,
            price: new BigNumber(event.returnValues.price),
            seller,
            buyer,
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

export default ThetanArena;
