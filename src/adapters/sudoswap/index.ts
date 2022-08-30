
import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import moment from "moment";

import symbolSdk from "../../sdk/symbol";
import Ethereum from "../../sdk/EVMC";

import { Transaction } from "web3-core";

import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

class SudoSwap {
    sdk: any;

    name: string
    token: string
    block: number
    symbol: ISymbolAPIResponse | undefined
    protocol: string
    contract: string
    searchType: string

    pathToAbi: string | undefined;

    constructor() {
        this.name = 'sudoswap'
        this.token = '0x0000000000000000000000000000000000000000'
        this.block = 15427690
        this.symbol = undefined
        this.protocol = 'ethereum'
        this.contract = '0x2b2e8cda09bba9660dca5cb6233787738ad68329'

        this.pathToAbi = path.join(__dirname, "./abi.json");

        this.sdk = new Ethereum(this);
    }

    run = async (): Promise<void> => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.symbol = symbol;

        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    loadSdk = async () => {
        return new Ethereum(this);
    };

    process = async (transaction: Transaction): Promise<ISaleEntity | undefined> => {
        
        const block = await this.sdk.getBlock(transaction.blockNumber)

        const timestamp = moment.unix(block.timestamp).utc();

        const receipt = await this.sdk.getTransactionReceipt(transaction.hash)

        const transferLogs = receipt.logs.filter((log: any) => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')

        for (let transfer of transferLogs) {
            const nftBuyer = this.sdk.hexToAddress(transfer.topics[1])
            const nftSeller = this.sdk.hexToAddress(transfer.topics[2])
            const nftNumber = this.sdk.web3.utils.hexToNumber(transfer.topics[3])

            const entity: ISaleEntity = {
                token: this.token,
                protocol: this.protocol,
                tokenSymbol: this.symbol?.symbol || "",
                providerName: this.name,
                providerContract: this.contract,
        
                nftId: nftNumber,
                amount: 1,
                nftContract: transfer.address.toLowerCase(),

                buyer: nftBuyer.toLowerCase(),
                seller: nftSeller.toLowerCase(), 

                price: 0,
                priceUsd: 0,
                soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),

                blockNumber: <number>transaction.blockNumber,
                transactionHash: transaction.hash,
            };
        
            await this.addToDatabase(entity);
        }

        return;
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default SudoSwap;