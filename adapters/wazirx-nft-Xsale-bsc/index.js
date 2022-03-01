require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const { AVAILABLE_PROTOCOLS } = require("../../sdk/constants");

class WazirxNft {
    constructor() {
        this.name = "WazirXNFT";
        this.symbol = "WRXNFT";
        this.currencyCode = {
            "0": {
                symbol: "WRX",
                decimals: 8,
                token_address: "0x8e17ed70334c87ece574c9d537bc153d8609e2a3",
            },
            "1": {
                symbol: "WRX",
                decimals: 8,
                token_address: "0x8e17ed70334c87ece574c9d537bc153d8609e2a3",
            },
            "2": {
                symbol: "BNB",
                decimals: 18,
                token_address: "bnb",
            },
        };
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "bsc";
        this.token_symbol = "bnb";
        this.block = 14571030;
        this.contract = "0x0edAbdB72be02Cc7CF1D29894ACA1B1053286919";
        this.events = ["TokenSold"];
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
    getPrice = async (timestamp, token_address) => {
        const resp = await axios.get(
            `${URL}/token-price?key=${KEY}&token_address=${token_address}&protocol=${this.protocol}&timestamp=${timestamp}`,
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
        const currency = this.currencyCode[event.returnValues.currency]; // Internal currency identification
        let nativePrice;
        const po = await this.getPrice(block.timestamp, currency.token_address);

        // calculate price according to the currency(BNB / WRX)
        if (["0", "1"].includes(event.returnValues.currency)) {
            const bnbusd = await this.getPrice(block.timestamp, this.currencyCode["2"].token_address);
            nativePrice = new BigNumber(event.returnValues.price)
                .dividedBy(10 ** currency.decimals)
                .times(po.price)
                .dividedBy(bnbusd.price); //Convert WRX to BNB
        } else {
            nativePrice = new BigNumber(event.returnValues.price).dividedBy(10 ** currency.decimals);
        }

        const tokenId = event.returnValues.tokenId;

        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            protocol: AVAILABLE_PROTOCOLS.BSC,
            nft_contract: event.returnValues.nftContract,
            nft_id: tokenId,
            token: this.token,
            token_symbol: this.token_symbol,
            amount: 1,
            price: nativePrice.toNumber() || 1,
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: event.returnValues.seller,
            buyer: event.returnValues.buyer,
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
module.exports = WazirxNft;
