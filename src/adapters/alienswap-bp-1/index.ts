import moment from "moment";
import {EventData} from "web3-eth-contract";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Alienswap extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["OrderFulfilled"];
    }

    process = async (event: EventData): Promise<void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const tokenId = event.returnValues.offer[0][2];
        const nftContract = event.returnValues.offer[0][1];
        const amount = event.returnValues.offer[0][3];
        const baseTx = await this.sdk.getTransaction(event.transactionHash);

        if (baseTx.value == 0) {
            return;
        }

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            chainId: this.sdk.chainId,
            nfts: [
                {
                    id: tokenId,
                    amount: Number(amount),
                    contract: nftContract.toLowerCase(),
                },
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(event.returnValues.consideration[0][3]),
            seller: event.returnValues.offerer.toLowerCase(),
            buyer: event.returnValues.recipient.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Alienswap;
