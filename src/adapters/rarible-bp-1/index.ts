import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity, IObjectStringAny} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Rarible extends BasicProvider {
    defaultPaymentToken: string;
    event: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.event = "transfer";
    }

    process = async (call: any) => {
        if ("applied" !== call.status) {
            return;
        }

        const operation = await this.sdk.getOperation(call.hash);
        const transfers = operation.filter((o: IObjectStringAny) => o?.parameter?.entrypoint === "do_transfers");

        if (!transfers.length) {
            return;
        }

        const sorted = operation
            .filter((o: IObjectStringAny): boolean => !!o.target)
            .sort((a: IObjectStringAny, b: IObjectStringAny): number => +b?.amount - +a?.amount);
        const biggest = sorted[0];

        if (!Number(biggest?.amount)) {
            return;
        }

        if (!biggest?.target) {
            return;
        }

        const transferOp = operation.find((o: IObjectStringAny): boolean => {
            return o?.parameter?.entrypoint === "transfer" && o?.target?.address === this.contract;
        });

        if (!transferOp) {
            return;
        }

        const timestamp = moment(call.timestamp, "YYYY-MM-DDTHH:mm:ssZ").utc();
        const seller = transferOp.parameter.value[0].address;
        const buyer = transferOp.initiator.address;
        const nftContract = transferOp.target.address;
        const nftId = transferOp.parameter.value[0].list[0].token_id;

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nftContract,
                    id: nftId,
                    amount: 1
                },
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(biggest.amount),
            seller,
            buyer,
            soldAt: timestamp,
            blockNumber: call.level,
            transactionHash: call.hash,
            chainId: this.sdk.chainId,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Rarible;
