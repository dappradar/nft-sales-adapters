import BigNumber from "bignumber.js";
import moment from "moment";
import {EventData} from "web3-eth-contract";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

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

class OKX extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["MatchOrderResults"];
    }

    private getToken = (paymentTokenContract: any): string => {
        if (paymentTokenContract === "0x0000000000000000000000000000000000000000") {
            return this.defaultPaymentToken;
        }

        return paymentTokenContract.toLowerCase();
    };

    private processItem = async (event: EventData, item: any): Promise<ISaleEntity> => {
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
        const token = this.getToken(paymentTokenContract);
        const isAcceptOffer = Number(actionType) === 3;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = isAcceptOffer ? maker : taker;
        const seller = isAcceptOffer ? taker : maker;

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
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

        return this.addToDatabase(entity);
    };

    private handleExtraData = (data: any) => {
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

    process = async (event: EventData): Promise<ISaleEntity[]> => {
        const extraData = event.returnValues.extraData;
        const params = this.handleExtraData(extraData);

        const sales: ISaleEntity[] = [];

        for (let i = 0; i < params.length; i++) {
            sales.push(await this.processItem(event, params[i]));
        }

        return sales;
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default OKX;
