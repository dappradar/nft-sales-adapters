require("dotenv").config();

const moment = require("moment");
const Binance = require("../../sdk/binance");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const BigNumber = require("bignumber.js");

class BombCrypto {
    constructor() {
        this.name = "bombcrypto-bnb";
        this.symbol = "BNB";
        this.token = "bnb";
        this.protocol = "binance";
        this.block = 8867059;
        this.contract = "0xe29f0b490f0d89ca7acac1c7bed2e07ecad65201";
        this.events = ["TokenBought", "TokenBidAccepted"];
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
        return new Binance(this);
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

    getPrice = async timestamp => {
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

    getBuyer = event => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.bid.bidder;
        }
        return event.returnValues.buyer;
    };

    _getPrice = async (event, block) => {
        if (!this.symbol.decimals) {
            return { price: null, priceUsd: null };
        }

        const po = await this.getPrice(block.timestamp);

        let value = 0;
        if (event.event === "TokenBidAccepted") {
            value = event.returnValues.bid.value;
        } else {
            value = event.returnValues.listing.value;
        }
        const nativePrice = new BigNumber(value).dividedBy(10 ** this.symbol.decimals);

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    getSeller = event => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.seller;
        }
        return event.returnValues.listing.seller;
    };

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        if (!buyer) {
            return;
        }
        if (event.event === "TokenBidAccepted") {
            const paymentToken = await this.sdk.callContractMethod('paymentToken');
            this.token = paymentToken.toLowerCase();
        } else {
            this.token = 'avax';
        }

        const s = await this.getSymbol();
        this.symbol = s;
        const { price, priceUsd } = await this._getPrice(event, block);

        const tokenId = event.returnValues.tokenId;
        const seller = this.getSeller(event);
        const nftContract = event.returnValues.erc721Address.toLowerCase();
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

module.exports = BombCrypto;
