require("dotenv").config();

const web3 = require("web3");
const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
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
        this.block = 7836850;
        this.nftContract = "0x23Cad0003e3A2b27b12359B25c25dD9a890AF8e1";
        this.contract = "0xBfDF64B48A46E66f665338EA3666d8c5dB043f05";
        this.events = ["AuctionFinalized"];
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
        let nativePrice;
        let po = 0;
        let seller = {
            address: null,
            price: 0,
        };

        const tokenId = event.returnValues._tokenId;

        const transaction = await this.sdk.getTransactionReceipt(event.transactionHash);

        const auctionContract = this.sdk.web3.eth.abi.encodeParameter("address", this.contract);
        const logs = transaction.logs.filter(
            tx => tx.topics[0] === TRANSFER_TOPIC && tx.topics[1].toLowerCase() === auctionContract,
        );

        const bnbusd = await this.getPrice(block.timestamp, this.currencyCode["2"].token_address);

        if (logs.length) {
            // Look for highest amount transfer
            const price = logs.reduce((sum, item, index) => {
                const decodedPrice = new BigNumber(item.data).dividedBy(10 ** 8).toNumber();
                const address = this.sdk.web3.eth.abi.decodeParameter("address", item.topics[2]);
                sum += decodedPrice;

                if (index === 0) {
                    seller = {
                        address: address,
                        price: decodedPrice,
                    };
                } else if (decodedPrice > seller.price) {
                    seller = {
                        address: address,
                        price: decodedPrice,
                    };
                }
                return sum;
            }, 0);
            po = await this.getPrice(block.timestamp, this.currencyCode["1"].token_address);
            nativePrice = new BigNumber(price).times(po.price).dividedBy(bnbusd.price);
        } else {
            // Look for latest BidPlaced event by bid winner to find price
            let events = [];
            let _event = {};
            let blockRange = event.blockNumber;
            while (!events.length) {
                events = await this.sdk.getPastEvents("BidPlaced", {
                    filter: { _tokenId: tokenId, _from: event.returnValues._bidWinner, _currency: "2" },
                    fromBlock: blockRange - 5000,
                    toBlock: blockRange,
                });
                blockRange -= 5000;
            }

            _event = events[events.length - 1];
            nativePrice = new BigNumber(_event.returnValues._amount).dividedBy(10 ** 18);
            po = bnbusd;
            seller = {
                address: event.returnValues._settledBy,
            };
        }

        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            protocol: AVAILABLE_PROTOCOLS.BSC,
            nft_contract: this.nftContract,
            nft_id: tokenId,
            token: this.token,
            token_symbol: this.token_symbol,
            amount: 1,
            price: nativePrice.toNumber() || 1,
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: seller.address,
            buyer: event.returnValues._bidWinner,
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
