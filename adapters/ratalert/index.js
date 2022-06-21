require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Matic = require("../../sdk/matic");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

class RatAlert {
    constructor() {
        this.name = "ratalert";
        this.symbol = "ETH";
        this.token = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"; // WETH
        this.protocol = "polygon";
        this.block = 28184455;
        this.contract = "0x3242CCF5d7f35BaB5A560e7ae2Fa64EfDCa9Cd1c"; // RATCAST
        this.events = ["Transfer"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.sdk = new Matic(this);
    }

    run = async () => {
        this.sdk = this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Matic(this);
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

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const baseTx = await this.sdk.getTransaction(event.transactionHash);
        if (baseTx.value === "0") {
            return; // ignore mints
        }
        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
        let nativePrice = new BigNumber(0);
        for (let i = 0; i < txReceipt.logs.length; i++) {
            if (
                txReceipt.logs[i].address.toLowerCase() === this.token.toLowerCase() &&
                txReceipt.logs[i].topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
                txReceipt.logs[i].topics[2].toLowerCase().includes(event.returnValues.from.toLowerCase().substr(2))
            ) {
                nativePrice = new BigNumber(txReceipt.logs[i].data).dividedBy(10 ** 18);
            }
        }
        if (nativePrice.toNumber() === 0) {
            return; // Ignore simple transfers
        }
        const po = await this.getPrice(block.timestamp);
        const entity = {
            provider_name: this.name, // the name of the folder
            provider_contract: this.contract, // the providers contract from which you get data
            protocol: this.protocol,
            nft_contract: this.contract,
            nft_id: event.returnValues.tokenId,
            token: this.token,
            token_symbol: this.symbol,
            amount: 1,
            price: nativePrice.toNumber(),
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: event.returnValues.from,
            buyer: event.returnValues.to,
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

module.exports = RatAlert;
