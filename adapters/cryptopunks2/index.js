require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Matic = require("../../sdk/matic");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

class CRYPTOPUNKS2 {
    constructor() {
        this.name = "cryptopunks2";
        this.token = "matic";
        this.protocol = "polygon";
        this.block = 20346370;
        this.contract = "0xc02d332abc7f9e755e2b1eb56f6ae21a7da4b7ad";
        this.events = ["Transfer"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol = s;
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

    getBuyer = async event => {
        const buyer = event.returnValues.owner;
        if (event.event === "Mint") {
            const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            return txReceipt.from;
        }
        return buyer;
    };

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const baseTx = await this.sdk.getTransaction(event.transactionHash);
        if (baseTx.value == 0) {
            return; // ignore marketing (zero value) mints
        }

        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);

        let numberOfTokens = 0;

        for (let i = 0; i < txReceipt.logs.length; i++) {
            if (txReceipt.logs[i].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                numberOfTokens++;
            }
        }

        const po = await this.getPrice(block.timestamp);
        let nativePrice = new BigNumber(0);
        if (baseTx.value > 0) nativePrice = new BigNumber(baseTx.value).dividedBy(10 ** 18).dividedBy(numberOfTokens);

        const buyer = baseTx.from;

        if (!buyer) {
            return;
        }

        const tokenId = event.returnValues.tokenId;
        const entity = {
            provider_name: this.name, // the name of the folder
            provider_contract: this.contract, // the providers contract from which you get data
            protocol: this.protocol,
            nft_contract: this.contract,
            nft_id: tokenId,
            token: this.token,
            token_symbol: this.symbol.symbol,
            amount: 1,
            price: nativePrice.toNumber(),
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: this.contract,
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

module.exports = CRYPTOPUNKS2;
