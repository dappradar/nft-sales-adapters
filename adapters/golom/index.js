require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

class GOLOM {

    constructor() {
        this.name = "golom";
        this.symbol = "eth";
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 14880514;
        this.contract = "0xd29e1FcB07e55eaceB122C63F8E50441C6acEdc9";
        this.events = ["OrderFilled"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = new Ethereum(this);
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol=s;
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

    getBuyer = async event => {
        const buyer = event.returnValues.taker;
        if (event.event === "OrderFilled") {
            const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            return txReceipt.from;
        }
        return buyer;
    };

    getNftId = async event =>{
        
        if (event.event === "OrderFilled") {
            const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            const logs = txReceipt.logs
            for (let i=0; i<logs.length; i++){
                let topics=logs[i].topics
                if (topics[0]==="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"){  // transfer topics
                    const tokenidhex = topics[3];
                    const tokenId = parseInt(tokenidhex, 16);
                    return tokenId
                   
                }
            }
            
        }
        return null;
    }

    process = async event => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await this.getPrice(block.timestamp);
        const nativePrice = new BigNumber(event.returnValues.price).dividedBy(10 ** this.symbol.decimals);
        const buyer = await this.getBuyer(event);
        if (!buyer) {
            return;
        }

        const tokenId = await this.getNftId(event);
        if (!tokenId) {
            return;
        }
        const entity = {
            provider_name: this.name, 
            provider_contract: this.contract, 
            protocol: this.protocol,
            nft_contract: this.contract,
            nft_id: tokenId.toString(),
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

module.exports = GOLOM;
