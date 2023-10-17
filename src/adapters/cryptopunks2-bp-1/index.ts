import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";
import {Log} from "web3-core";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

class CRYPTOPUNKS2 extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["Transfer"];
    }

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const baseTx = await this.sdk.getTransaction(event.transactionHash);

        if (baseTx.value == 0) {
            return;
        }

        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
        const numberOfTokens = txReceipt.logs.filter((log: Log) => log.topics[0] === TRANSFER_TOPIC).length;
        const price = new BigNumber(baseTx.value).dividedBy(numberOfTokens);
        const buyer = baseTx.from.toLowerCase();
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: this.contract,
                    id: event.returnValues.tokenId,
                    amount: 1,
                },
            ],
            token: this.defaultPaymentToken,
            price,
            seller: this.contract,
            buyer,
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: 16,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default CRYPTOPUNKS2;
