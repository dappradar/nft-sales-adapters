import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import priceSdk from "../../sdk/price";
import Avalanche from "../../sdk/avalanche";
import symbolSdk from "../../sdk/symbol";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { BlockTransactionString } from "web3-eth";

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
        this.name = "element-avalanche-1";
        this.protocol = "avalanche";
        this.block = 13749004;
        this.contract = "0x18cd9270dbdca86d470cfb3be1b156241fffa9de";
        this.events = ["TokenBought", "TokenBidAccepted"];
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

    _getBuyer = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.bid.bidder;
        }
        return event.returnValues.buyer;
    };

    _getSeller = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.seller;
        }
        return event.returnValues.listing.seller;
    };

    _getPaymentToken = async (event: EventData): Promise<string> => {
        if (event.event === "TokenBidAccepted") {
            const paymentTokenCall = await this.sdk.callContractMethod("paymentToken");
            return paymentTokenCall.toLowerCase();
        }

        return "avax";
    };

    _getPrice = async (
        event: EventData,
        block: BlockTransactionString,
        symbol: ISymbolAPIResponse,
        paymentToken: string,
    ): Promise<{ price: number | null; priceUsd: number | null }> => {
        if (!symbol?.decimals) {
            return {
                price: null,
                priceUsd: null,
            };
        }

        const po = await priceSdk.get(paymentToken, this.protocol, +block.timestamp);

        let value: number;
        if (event.event === "TokenBidAccepted") {
            value = event.returnValues.bid.value;
        } else {
            value = event.returnValues.listing.value;
        }
        const nativePrice = new BigNumber(value).dividedBy(10 ** (symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (event: EventData): Promise<void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this._getBuyer(event).toLowerCase();
        if (!buyer) {
            return;
        }
        const paymentToken = await this._getPaymentToken(event);
        const symbol = await symbolSdk.get(paymentToken, this.protocol);
        const { price, priceUsd } = await this._getPrice(event, block, symbol, paymentToken);
        const seller = this._getSeller(event).toLowerCase();
        const nftContract = event.returnValues.erc721Address.toLowerCase();
        const tokenId = event.returnValues["erc721TokenId"] || event.returnValues["erc1155TokenId"];

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: this.token,
            tokenSymbol: symbol?.symbol || "",
            amount: 1,
            price,
            priceUsd,
            seller,
            buyer,
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
