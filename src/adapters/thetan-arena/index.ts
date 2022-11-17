import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import moment from "moment";
import BSC from "../../sdk/binance";
import BigNumber from "bignumber.js";
import priceSdk from "../../sdk/price";
import symbolSdk from "../../sdk/symbol";
import { EventData } from "web3-eth-contract";
import { BlockTransactionString } from "web3-eth";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

class ThetanArena {
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
        this.name = "thetan-arena";
        this.symbol = undefined;
        this.token = "0x0000000000000000000000000000000000000000";
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

    _getPrice = async (
        event: EventData,
        block: BlockTransactionString,
        symbol: ISymbolAPIResponse,
        paymentToken: string,
    ): Promise<{ price: number | null; priceUsd: number | null }> => {
        const po = await priceSdk.get(paymentToken, this.protocol, +block.timestamp);

        if (!symbol?.decimals) {
            return {
                price: null,
                priceUsd: null,
            };
        }

        const amount = event.returnValues.price;
        const nativePrice = new BigNumber(amount).dividedBy(10 ** (symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const buyer = event.returnValues.buyer.toLowerCase();
        const seller = event.returnValues.seller.toLowerCase();
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.contractAddress.toLowerCase();
        const paymentToken = event.returnValues.paymentToken.toLowerCase();
        const symbol = await symbolSdk.get(paymentToken, this.protocol);

        const { price, priceUsd } = await this._getPrice(event, block, symbol, paymentToken);

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract,
            nftId: tokenId,
            token: paymentToken,
            tokenSymbol: symbol?.symbol || "",
            amount: 1,
            price,
            priceUsd: priceUsd,
            seller,
            buyer,
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

export default ThetanArena;
