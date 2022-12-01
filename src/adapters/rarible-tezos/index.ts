import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import BigNumber from "bignumber.js";
import Tezos from "../../sdk/tezos";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";

import { ISaleEntity, ISymbolAPIResponse, IObjectStringAny } from "../../sdk/Interfaces";

const PROTOCOL = "tezos";
const TOKEN = "xtz";

class RaribleTezos {
    name: string;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    event: string;
    symbol: ISymbolAPIResponse | undefined;
    sdk: any;

    constructor() {
        this.name = "rarible-tezos";
        this.token = TOKEN;
        this.protocol = PROTOCOL;
        this.block = 0;
        this.contract = "KT18pVpRXKPY2c4U2yFEGSH3ZnhB2kL8kwXS";
        this.event = "transfer";
        this.sdk = undefined;
    }

    run = async (): Promise<void> => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.symbol = symbol;

        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    loadSdk = (): any => {
        return new Tezos(this);
    };

    process = async (call: any) => {
        if ("applied" !== call.status) {
            return;
        }

        const operation = await this.sdk.getOperation(call.hash);
        const transfers = operation.filter((o: IObjectStringAny) => o?.parameter?.entrypoint === "do_transfers");
        if (transfers.length === 0) {
            return;
            // no transfers were made
        }
        const sorted = operation
            .filter((o: IObjectStringAny): boolean => !!o.target)
            .sort((a: IObjectStringAny, b: IObjectStringAny): number => +b?.amount - +a?.amount);
        const biggest = sorted[0];
        if (+biggest?.amount === 0) {
            // no money was transferred
            return;
        }
        if (!biggest?.target) {
            return;
        }
        const timestamp = moment(call.timestamp, "YYYY-MM-DDTHH:mm:ssZ").utc();
        const po = await priceSdk.get(this.token, this.protocol, timestamp.unix());
        const nativePrice = new BigNumber(biggest.amount).dividedBy(10 ** (this.symbol?.decimals || 0));

        const transferOp = operation.find((o: IObjectStringAny): boolean => {
            return o?.parameter?.entrypoint === "transfer" && o?.target?.address === this.contract;
        });
        if (!transferOp) {
            return;
        }
        const seller = transferOp.parameter.value[0].address;
        const buyer = transferOp.initiator.address;
        const nft_collection_address = transferOp.target.address;
        const nft_id = transferOp.parameter.value[0].list[0].token_id;

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nftContract: nft_collection_address,
            nftId: nft_id,
            token: TOKEN,
            tokenSymbol: this.symbol?.symbol || "",
            amount: 1,
            price: nativePrice.toNumber(),
            priceUsd: !this.symbol?.decimals ? null : nativePrice.multipliedBy(po.price).toNumber(),
            seller,
            buyer,
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: call.level,
            transactionHash: call.hash,
            protocol: PROTOCOL,
        };

        await this.addToDatabase(entity);
    };
    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default RaribleTezos;
