require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

class ELEMENT {
    // stands for Ethereum name service
    constructor() {
        this.name = "element";
        this.symbol = "ETH";
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 15080677;
        this.contract = "0x20f780a973856b93f63670377900c1d2a50a77c4";
        this.events = [
            "ERC721SellOrderFilled",
            "ERC721BuyOrderFilled",
            "ERC1155SellOrderFilled",
            "ERC1155BuyOrderFilled",
        ];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = new Ethereum(this);
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol = s;
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

    // getBuyer = async event => {
    //     const buyer = event.returnValues.owner;
    //     if (event.event === "NameRenewed") {
    //         const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
    //         if (txReceipt === null) {
    //             return null;
    //         }
    //         return txReceipt.from;
    //     }
    //     return buyer;
    // };

    process = async event => {
        const isER721 = event.event === "ERC721SellOrderFilled" || event.event === "ERC721BuyOrderFilled";
        const isSellOrder = ["ERC721SellOrderFilled", "ERC1155SellOrderFilled"].includes(event.event);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await this.getPrice(block.timestamp);
        const amount = isER721 ? 1 : event.returnValues["erc1155FillAmount"];
        const price = isER721 ? event.returnValues["erc20TokenAmount"] : event.returnValues["erc20FillAmount"];
        const nativePrice = new BigNumber(price).dividedBy(10 ** this.symbol.decimals);
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const buyer = isSellOrder ? taker : maker;
        const seller = isSellOrder ? maker : taker;
        const nft_contract = event.returnValues["erc721Token"] || event.returnValues["erc1155Token"];
        const tokenId = event.returnValues["erc721TokenId"] || event.returnValues["erc1155TokenId"];
        const erc20token = event.returnValues["erc20Token"];
        const token =
            erc20token.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
                ? "0x0000000000000000000000000000000000000000"
                : erc20token;
        const entity = {
            provider_name: this.name, // the name of the folder
            provider_contract: this.contract.toLowerCase(), // the providers contract from which you get data
            protocol: this.protocol,
            nft_contract: nft_contract.toLowerCase(),
            nft_id: tokenId,
            token: token.toLowerCase(),
            token_symbol: this.symbol.symbol,
            amount,
            price: nativePrice.toNumber(),
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
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

module.exports = ELEMENT;
