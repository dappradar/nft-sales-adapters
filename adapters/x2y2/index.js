require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "https://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

const OP_COMPLETE_SELL_OFFER = 1; // COMPLETE_SELL_OFFER
const OP_COMPLETE_BUY_OFFER = 2; // COMPLETE_BUY_OFFER
// const OP_COMPLETE_AUCTION = 5; // COMPLETE_AUCTION
const COMPLETE_OPS = [OP_COMPLETE_SELL_OFFER, OP_COMPLETE_BUY_OFFER];

class X2Y2 {
    // stands for Ethereum name service
    constructor() {
        this.name = "X2Y2";
        this.symbol = "X2Y2";
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 14139341;
        this.contract = "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3";
        this.events = ["EvInventory"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = new Ethereum(this);
    }

    run = async () => {
        this.sdk = this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Ethereum(this);
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
        const symbol = resp.data;
        return symbol;
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

    getNftToken = async event => {
        let tokenData = "";
        const data = event.returnValues["item"]["data"];
        const dataMask = event.returnValues["dataMask"];
        const dataReplacement = event.returnValues["detail"]["dataReplacement"];
        if (dataMask && dataReplacement && dataMask.length === data.length && data.length === dataReplacement.length) {
            for (let i = 0; i < dataMask.length; i++) {
                tokenData += dataMask.charAt(i) === "1" ? dataReplacement.charAt(i) : data.charAt(i);
            }
        }
        if (!tokenData) {
            tokenData = data;
        }
        const contract = "0x" + tokenData.substring(tokenData.length - 104, tokenData.length - 64);
        const tokenId = new BigNumber("0x" + tokenData.substring(tokenData.length - 64)).toString(10);
        return { contract, tokenId };
    };

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const detail = event.returnValues["detail"];
        const nativePrice = new BigNumber(detail["price"]).dividedBy(10 ** 18);
        const po = await this.getPrice(block.timestamp);
        const price_usd = nativePrice.multipliedBy(po.price).toNumber();
        const token = event.returnValues["currency"];
        const token_symbol = token === "0x0000000000000000000000000000000000000000" ? "ETH" : "WETH";
        const op = parseInt(detail["op"]);
        if (!COMPLETE_OPS.includes(op) || !maker || !taker) {
            return;
        }
        const buyer = op === OP_COMPLETE_BUY_OFFER ? maker : taker;
        const seller = op === OP_COMPLETE_BUY_OFFER ? taker : maker;
        const nftToken = await this.getNftToken(event);
        const entity = {
            provider_name: this.name, // the name of the folder
            provider_contract: this.contract, // the providers contract from which you get data
            protocol: this.protocol,
            nft_contract: nftToken.contract,
            nft_id: nftToken.tokenId,
            token,
            token_symbol,
            amount: 1,
            price: nativePrice.toNumber(),
            price_usd,
            seller,
            buyer,
            sold_at: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            block_number: event.blockNumber,
            transaction_hash: event.transactionHash,
        };
        await this.addToDatabase(entity);
    };

    addToDatabase = async entity => {
        console.log(`creating sale for ${entity.nft_contract} with id ${entity.nft_id}`);
        return entity;
    };
}

module.exports = X2Y2;
