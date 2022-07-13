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
        this.contract = "0xe29f0b490f0d89ca7acac1c7bed2e07ecad65201"; // abi used for 0x5713Ae21F4Bb696A877c90CCcAE310eFF4c4652A(Proxy Contract abi) - https://bscscan.com/address/0xe29F0B490F0d89CA7ACAc1C7BeD2E07eCAD65201#readProxyContract
        this.events = ["OfferMatched", "ItemListed", "OwnershipTransferred"];
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
        if (event.event === "OwnershipTransferred") {
            return event.returnValues.newOwner;
        }
        return event.returnValues.buyer;
    };

    _getPrice = async (event, block) => {
        if (!this.symbol.decimals) {
            return { price: null, priceUsd: null };
        }

        const po = await this.getPrice(block.timestamp);

        let value = 0;
        if (event.event === "ItemListed") {
            value = event.returnValues.price;
        }

        const nativePrice = new BigNumber(value).dividedBy(10 ** this.symbol.decimals);

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    getSeller = event => {
        return event.returnValues.seller;
    };

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this.getBuyer(event);
        if (!buyer) {
            return;
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
            token: "bnb",
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
