require("dotenv").config();

const moment = require("moment");
const Avalanche = require("../../sdk/avalanche");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const BigNumber = require("bignumber.js");

class kalao-avalanche{
    constructor() {
        this.name = "kalao-avalanche";
        this.symbol = "AVAX";
        this.token = "avax";
        this.protocol = "avalanche";
        this.block = 7369141;
        this.contract = "0x11ac3118309a7215c6d87c7c396e2df333ae3a9c";
        this.searchType = "topics";
        this.eventsTopics = ["0x410787feaee69e25111c916ccc79ee0fb3dd27b169bcb00209efdd59c5148f36"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
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

    getBuyerInfo = async transaction => {
        const pubrchaseLog = transaction.logs.find(
            l => l.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Purchase Event Log
        );
        if (!pubrchaseLog) {
            return;
        }
        const nftContract = pubrchaseLog.address;
        const buyer = "0x" + pubrchaseLog.topics[2].substr(-40, 40);
        const tokenId = parseInt(pubrchaseLog.topics[3], 16);

        return {
            nftContract,
            tokenId,
            buyer,
        };
    };

    getSeller = async (dealId, block) => {
        const seller = await this.sdk.callContractMethod("getSeller", [dealId], [undefined, block.number]);
        return seller;
    };

    _getPrice = async (dealId, block) => {
        if (!this.symbol.decimals) {
            return { price: null, priceUsd: null };
        }

        const price = await this.sdk.callContractMethod("getPrice", [dealId], [undefined, block.number]);
        const po = await this.getPrice(block.timestamp);
        const nativePrice = new BigNumber(price).dividedBy(10 ** this.symbol.decimals);

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async event => {
        const dealId = parseInt(event.data.substr(0, 66), 16);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const transaction = await this.sdk.getTransactionReceipt(event.transactionHash);
        const buyerInfo = await this.getBuyerInfo(transaction);
        if (!buyerInfo) {
            return;
        }
        const seller = await this.getSeller(dealId, block);
        if (!seller) {
            return;
        }
        const { price, priceUsd } = await this._getPrice(dealId, block);

        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            protocol: this.protocol,
            nft_contract: buyerInfo.nftContract,
            nft_id: buyerInfo.tokenId,
            token: this.token,
            token_symbol: this.symbol.symbol,
            amount: 1,
            price,
            price_usd: priceUsd,
            seller: seller.toLowerCase(),
            buyer: buyerInfo.buyer.toLowerCase(),
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

module.exports = kalao-avalanche;
