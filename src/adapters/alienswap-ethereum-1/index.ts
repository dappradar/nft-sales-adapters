import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/ethereum";
import { ISaleEntity } from "../../sdk/Interfaces";

class Alienswap {
    name: string;
    protocol: string;
    block: number;
    token: string;
    deprecatedAtBlock: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "alienswap-ethereum-1";
        this.protocol = "ethereum";
        this.block = 17080133;
        this.token = "eth";
        this.contract = "0x83746de31fc8de985ffe46c1c20ea6d7d8f4ed3a";
        this.events = ["OrderFulfilled"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Ethereum(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    process = async (event: EventData): Promise<void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const tokenId = event.returnValues.offer[0][2];
        const nftContract = event.returnValues.offer[0][1];
        const amount = event.returnValues.offer[0][3];
        const baseTx = await this.sdk.getTransaction(event.transactionHash);
        if (baseTx.value == 0) {
            return;
        }
        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            chainId: this.sdk.chainId,
            nfts: [
                {
                    id: tokenId,
                    amount: Number(amount),
                    contract: nftContract.toLowerCase(),
                },
            ],
            token: this.token,
            price: new BigNumber(event.returnValues.consideration[0][3]),
            seller: event.returnValues.offerer.toLowerCase(),
            buyer: event.returnValues.recipient.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };
        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Alienswap;
