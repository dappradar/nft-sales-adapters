import * as dotenv from "dotenv";

dotenv.config();

const moment = require("moment");
const Binance = require("../../sdk/binance");
const axios = require("axios");
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const BigNumber = require("bignumber.js");

class RadioCaca {
    constructor() {
        this.name = "radiocaca-bnb";
        this.symbol = "BNB";
        this.token = "bnb";
        this.protocol = "binance-smart-chain";
        this.block = 8867059;
        this.contract = ""0xE97Fdca0A3Fc76b3046aE496C1502c9d8dFEf6fc;
        this.events = ["AuctionExecuted"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async () => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.sdk = this.loadSdk();
        this.symbol = symbol;
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Binance(this);
    };

    getBuyer = async (event: EventData): Promise<string | null> => {
        const buyer = event.returnValues.owner;

        if (event.event === "AuctionExecuted") {
            const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            return txReceipt.from;
        }

        return buyer;
    };

    _getPrice = async (event: EventData, block: BlockTransactionString): Promise<IPricesResponse> => {
        if (!this.symbol?.decimals) {
            return { price: null, priceUsd: null };
        }

        const po = await priceSdk.get(this.token, this.protocol, +block.timestamp);
        const nativePrice = new BigNumber(event.returnValues.price).dividedBy(10 ** (this.symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    stop = async () => {
        this.sdk.stop();
    };


    getSeller = (event: EventData): string => {
        if (event.event === "AuctionExecuted") {
            return event.returnValues.bidder;
        }
        return event.returnValues.listing.bidder;
    };

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        if (!buyer) {
            return;
        }
        if (event.event === "ItemListed") {
            const paymentToken = await this.sdk.callContractMethod("paymentToken");
            this.token = paymentToken.toLowerCase();
        } else {
            this.token = "bnb";
        }

        const s = await this.getSymbol();
        this.symbol = s;
        const { price, priceUsd } = await this._getPrice(event, block);

        const tokenId = event.returnValues.tokenId;
        const seller = this.getSeller(event);
        const nftContract = this.contract.toLowerCase();
        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            protocol: this.protocol,
            nft_contract: nftContract,
            nft_id: tokenId,
            token: this.token,
            token_symbol: this.symbol.symbol,
            amount: 1,
            price,
            price_usd: priceUsd,
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            sold_at: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            block_number: event.blockNumber,
            transaction_hash: event.transactionHash,
        };
        await this.addToDatabase(entity);
    };

    addToDatabase = async entity => {
        return entity;
    };
}

module.exports = RadioCaca;
