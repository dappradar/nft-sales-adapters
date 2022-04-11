require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const BSC = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");
const { AVAILABLE_PROTOCOLS } = require("../../sdk/constants");

const WRX_TOKEN = "0x8e17ed70334c87ece574c9d537bc153d8609e2a3";
const BNB_TOKEN = "bnb";

class WazirxNft {
    constructor() {
        this.name = "WazirXNFT";
        this.symbol = "WRXNFT";
        this.currencyCode = {
            "0": {
                symbol: "WRX",
                decimals: 8,
                token_address: WRX_TOKEN,
            },
            "1": {
                symbol: "WRX",
                decimals: 8,
                token_address: WRX_TOKEN,
            },
            "2": {
                symbol: "BNB",
                decimals: 18,
                token_address: BNB_TOKEN,
            },
        };
        this.token = BNB_TOKEN;
        this.protocol = "bsc";
        this.block = 14675675;
        this.contract = "0x0edabdb72be02cc7cf1d29894aca1b1053286919";
        this.events = ["TokenSold"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.sdk = null;
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol = s;
        await this.sdk.run();
    };

    loadSdk = () => {
        return new BSC(this);
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
            const bnbusd = await this.getPrice(block.timestamp, BNB_TOKEN);
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
            token_symbol: this.symbol.symbol,
            amount: 1,
            price: nativePrice.toNumber() || 1,
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: event.returnValues.seller.toLowerCase(),
            buyer: event.returnValues.buyer.toLowerCase(),
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
