require("dotenv").config();

const moment = require("moment");
const Avalanche = require("../../sdk/avalanche");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const BigNumber = require("bignumber.js");

class KalaoAuction {
    constructor() {
        this.name = "kalao-auction";
        this.symbol = "AVAX";
        this.token = "avax";
        this.protocol = "avalanche";
        this.block = 7369150;
        this.contract = "0x36D69b62B5c312d27790751814b7099F1E3245B2";
        this.events = ["AuctionEnded"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol = s;
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Avalanche(this);
    };

    getSymbol = async () => {
        const resp = await axios.get(
            `${URL}/token-metadata?key=${KEY}&token_address=${this.token}&protocol=${this.protocol}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4619.141 Safari/537.36",
                },
            },
        );
        return resp.data;
    };

    getPrice = async (timestamp) => {
        const resp = await axios.get(
            `${URL}/token-price?key=${KEY}&token_address=${this.token}&protocol=${this.protocol}&timestamp=${timestamp}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4619.141 Safari/537.36",
                },
            },
        );
        return resp.data;
    };

    stop = async () => {
        this.sdk.stop();
    };

    getBuyer = (event) => {
        if (event.event === "AuctionEnded") {
            return event.returnValues.winner;
        }
        return null;
    };

    _getPrice = async (event, block) => {
        if (!this.symbol.decimals) {
            return { price: null, priceUsd: null };
        }

        const po = await this.getPrice(block.timestamp);

        let value = 0;
        if (event.event === "AuctionEnded") {
            value = event.returnValues.amount;
        } else {
            value = await this.sdk.callContractMethod("getPrice", [event.returnValues.position]);
        }
        const nativePrice = new BigNumber(value).dividedBy(10 ** this.symbol.decimals);

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    getSeller = async (event) => {
        const auctions = await this.sdk.callContractMethod("auctions", [event.returnValues.position]);
        return auctions.seller;
    };

    process = async (event) => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        if (!buyer) {
            return;
        }
        const s = await this.getSymbol();
        this.symbol = s;
        const { price, priceUsd } = await this._getPrice(event, block);
        if (!price) {
            return;
        }
        const tokenId = await this.sdk.callContractMethod("getTokenId", [event.returnValues.position]);
        const seller = await this.getSeller(event);
        const nftContract = await this.sdk.callContractMethod("getTokenAddress", [event.returnValues.position]);
        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            protocol: this.protocol,
            nft_contract: nftContract.toLowerCase(),
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

    addToDatabase = async (entity) => {
        return entity;
    };
}

module.exports = KalaoAuction;
