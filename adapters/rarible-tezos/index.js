require("dotenv").config();

const moment = require("moment");
const BigNumber = require("bignumber.js");
const axios = require("axios");
const Tezos = require("../../sdk/tezos");

const PROTOCOL = "tezos";
const TOKEN = "xtz";

const KEY = process.env.DAPPRADAR_API_KEY;

class RaribleTezos {
    constructor() {
        this.name = "rarible-tezos";
        this.token = TOKEN;
        this.protocol = PROTOCOL;
        this.block = 0;
        this.contract = "KT18pVpRXKPY2c4U2yFEGSH3ZnhB2kL8kwXS";
        this.event = "transfer";
    }

    run = async () => {
        const s = await this.getSymbol();
        this.sdk = this.loadSdk();
        this.symbol = s;
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Tezos(this);
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

    process = async (call, _offset) => {
        if ("applied" !== call.status) {
            return;
        }

        const operation = await this.sdk.getOperation(call.hash);
        const transfers = operation.filter(
            o => o && o.parameter && o.parameter.entrypoint && o.parameter.entrypoint === "do_transfers",
        );
        if (transfers.length === 0) {
            return;
            // no transfers were made
        }
        const sorted = operation
            .filter(o => !!o.target)
            .sort(function(a, b) {
                return +b.amount - +a.amount;
            });
        const biggest = sorted[0];
        if (+biggest.amount == 0) {
            // no money was transferred
            return;
        }
        if (!biggest.target) {
            return;
        }
        const timestamp = moment(call.timestamp, "YYYY-MM-DDTHH:mm:ssZ").utc();
        const s = this.symbol;
        const po = await this.getPrice(timestamp);
        const nativePrice = new BigNumber(biggest.amount).dividedBy(10 ** s.decimals);

        const transferOp = operation.find(
            o =>
                o &&
                o.parameter &&
                o.parameter.entrypoint &&
                o.parameter.entrypoint === "transfer" &&
                o.target &&
                o.target.address === this.contract,
        );
        if (!transferOp) {
            return;
        }
        const seller = transferOp.parameter.value[0].address;
        const buyer = transferOp.initiator.address;
        const nft_collection_address = transferOp.target.address;
        const nft_id = transferOp.parameter.value[0].list[0].token_id;

        const entity = {
            provider_name: this.name,
            provider_contract: this.contract,
            nft_contract: nft_collection_address,
            nft_id: nft_id,
            token: TOKEN,
            token_symbol: s.symbol,
            amount: 1,
            price: nativePrice.toNumber(),
            price_usd: nativePrice.multipliedBy(po.price).toNumber(),
            seller,
            buyer,
            sold_at: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            block_number: call.level,
            transaction_hash: call.hash,
            protocol: PROTOCOL,
        };
        await this.addToDatabase(entity);
    };
    addToDatabase = async entity => {
        console.log(`creating sale for ${entity.nft_contract} with id ${entity.nft_id}`);
        return entity;
    };
}

module.exports = RaribleTezos;
