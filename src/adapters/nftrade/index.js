require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const Ethereum = require("../../sdk/EVMC");
const axios = require("axios");
const URL = "http://nft-sales-service.dappradar.com/open-source";
const KEY = process.env.DAPPRADAR_API_KEY;
const path = require("path");

const ERC20ProxyId = '0xf47261b0';
const ERC721ProxyId = '0x02571792';
const ERC1155ProxyId = '0xa7cb5fb7';

class NFTRADE {
    // stands for Ethereum name service
    constructor() {
        this.name = "nftrade";
        this.symbol = "ETH";
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 15080677;
        this.contract = "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3";
        this.events = [
            "Fill",
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

    getAssetProxyId = assetData => {
        return assetData.slice(0, 10);
    }

    isOffer = assetData => {
        return this.getAssetProxyId(assetData) === ERC20ProxyId;
    }
    
    getAssetDataAddress = assetData => {
        return ("0x").concat(assetData.slice(34, 74));
    }

    decodeERC721AssetData = assetData => {
        const address = this.getAssetDataAddress(assetData);
        const id = parseInt(assetData.slice(74, assetData.length));
        return { address, id };
    }
    
    decodeERC1155AssetData = assetData => {
        const tokenAddress = this.getAssetDataAddress(assetData);
        const tokenId = parseInt(assetData.slice(201, 264));
        return { tokenAddress, tokenId };
    }

    getNFTData = assetData => {
        const assetProxyId = this.getAssetProxyId(assetData);
      
        if (assetProxyId == ERC721ProxyId) return this.decodeERC721AssetData(assetData);
        else if (assetProxyId == ERC1155ProxyId) return this.decodeERC1155AssetData(assetData);
      
        return {
          tokenAddress: ADDRESS_ZERO,
          tokenId: 0,
        };
    }

    process = async event => {
        const isOffer = this.isOffer(event.returnValues["makerAssetData"]);
        const nft = this.getNFTData(event.returnValues[isOffer ? "takerAssetData" : "makerAssetData"]);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await this.getPrice(block.timestamp);
        const amount = 1;
        const price = event.returnValues[isOffer ? "makerAssetAmount" : "takerAssetAmount"];
        const nativePrice = new BigNumber(price).dividedBy(10 ** this.symbol.decimals);
        const maker = event.returnValues["maker"];
        const taker = event.returnValues["taker"];
        const buyer = isOffer ? maker : taker;
        const seller = isOffer ? taker : maker;
        const token = this.getAssetDataAddress(event.returnValues[isOffer ? "makerAssetData" : "takerAssetData"]);
        const entity = {
            provider_name: this.name, // the name of the folder
            provider_contract: this.contract.toLowerCase(), // the providers contract from which you get data
            protocol: this.protocol,
            nft_contract: nft.address.toLowerCase(),
            nft_id: nft.id,
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

module.exports = NFTRADE;
