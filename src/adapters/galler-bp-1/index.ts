import moment from "moment";
import BigNumber from "bignumber.js";
import {ISaleEntity} from "../../sdk/Interfaces";
import {EventData} from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Galler extends BasicProvider {
    defaultPaymentToken: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.events = ["OrdersMatched"];
    }

    private getNftContractAndId = async (event: EventData): Promise<[string | null, string | null]> => {
        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);

        const buyer = event.returnValues.secondMaker.toLowerCase();
        const seller = event.returnValues.firstMaker.toLowerCase();

        if (txReceipt === null) {
            return [null, null];
        }

        for (const log of txReceipt.logs) {
            const topics = log.topics;

            if (
                topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
                this.sdk.hexToAddress(topics[1]) === seller &&
                this.sdk.hexToAddress(topics[2]) === buyer
            ) {
                const nftContract = log.address.toLowerCase();
                const tokenIdHex = topics[3];
                const tokenId = parseInt(tokenIdHex, 16);

                return [nftContract, tokenId.toString()];
            }
        }

        return [null, null];
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const amount = event.returnValues.newFirstFill;
        const buyer = event.returnValues.secondMaker.toLowerCase();
        const seller = event.returnValues.firstMaker.toLowerCase();
        const [nftCollectionAddress, nftId] = await this.getNftContractAndId(event);

        if (!nftCollectionAddress) {
            throw new Error(`NFT collection address not defined for transaction "${event.transactionHash}". Provider "${this.name}"`);
        }

        if (!nftId) {
            throw new Error(`NFT ID not defined for transaction "${event.transactionHash}". Provider "${this.name}"`);
        }

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nfts: [
                {
                    contract: nftCollectionAddress,
                    id: nftId,
                    amount
                }
            ],
            token: this.defaultPaymentToken,
            price: new BigNumber(event.returnValues.newSecondFill),
            seller,
            buyer,
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Galler;
