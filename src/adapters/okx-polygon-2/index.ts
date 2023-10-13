import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Matic from "../../sdk/matic";
import { ISaleEntity } from "../../sdk/Interfaces";

const gap = 2;

const extraDataConfig = [
    {
        name: "version",
        unit: 2,
    },
    {
        name: "tradeType",
        unit: 1,
    },
    {
        name: "actionType",
        unit: 1,
    },
    {
        name: "taker",
        unit: 20,
        address: true,
    },
    {
        name: "maker",
        unit: 20,
        address: true,
    },
    {
        name: "nftContract",
        unit: 20,
        address: true,
    },
    {
        name: "tokenId",
        unit: 32,
    },
    {
        name: "amount",
        unit: 32,
    },
    {
        name: "paymentTokenAmount",
        unit: 32,
    },
    {
        name: "paymentTokenContract",
        unit: 20,
        address: true,
    },
];

export const handleExtraData = (data: any) => {
    const extraData = data.slice(2);
    const singleOrderLength = extraDataConfig.reduce((pre, cur) => pre + cur.unit, 0) * gap;
    let groupCursor = 0;
    // split multiple order
    const orderGroup = new Array(extraData.length / singleOrderLength).fill("").map((_, i) => {
        const res = extraData.substring(groupCursor, singleOrderLength * (i + 1));
        groupCursor += singleOrderLength;
        return res;
    });
    // handle orders data
    const params: any = [];
    orderGroup.forEach((order: any) => {
        let gapCursor = 0;
        const res: any = {};
        extraDataConfig.forEach(configItem => {
            const prefix = configItem.address ? "0x" : "";
            const toHexString = configItem.address
                ? order.substring(gapCursor, gapCursor + configItem.unit * 2)
                : parseInt(order.substring(gapCursor, gapCursor + configItem.unit * 2), 16);
            res[configItem.name] = prefix + toHexString;
            gapCursor += configItem.unit * gap;
        });
        params.push(res);
    });
    return params;
};

class OKX {
    name: string;
    protocol: string;
    block: number;
    deprecatedAtBlock: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "okx-polygon-1";
        this.protocol = "polygon";
        this.block = 48612325;
        // this.deprecatedAtBlock = 39539879;
        this.contract = "0xa7fd99748ce527eadc0bdac60cba8a4ef4090f7c";
        this.events = ["MatchOrderResults"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Matic(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (paymentTokenContract: any): string => {
        if (paymentTokenContract === "0x0000000000000000000000000000000000000000") {
            return "matic";
        }
        return paymentTokenContract.toLowerCase();
    };

    _processItem = async (event: EventData, item: any): Promise<void> => {
        const {
            actionType,
            paymentTokenAmount,
            paymentTokenContract,
            nftContract,
            tokenId,
            taker,
            maker,
            amount,
        } = item;
        const token = this._getToken(paymentTokenContract);
        const isAceeptOffer = Number(actionType) === 3;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = isAceeptOffer ? maker : taker;
        const seller = isAceeptOffer ? taker : maker;
        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nfts: [
                {
                    id: tokenId,
                    amount: Number(amount),
                    contract: nftContract.toLowerCase(),
                },
            ],
            token,
            price: new BigNumber(paymentTokenAmount),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };
        await this.addToDatabase(entity);
    };

    process = async (event: EventData): Promise<void> => {
        const extraData = event.returnValues.extraData;
        const params = handleExtraData(extraData);
        for (let i = 0; i < params.length; i++) {
            await this._processItem(event, params[i]);
        }
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default OKX;
