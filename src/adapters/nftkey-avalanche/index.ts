import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import Avalanche from "../../sdk/avalanche";
import path from "path";
import { ISaleEntity } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";
import getPaymentData from "../../sdk/utils/getPaymentData";

class NFTKey {
    name: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "nftkey-avalanche";
        this.protocol = "avalanche";
        this.block = 6421617;
        this.contract = "0x1a7d6ed890b6c284271ad27e7abe8fb5211d0739";
        this.events = ["TokenBought", "TokenBidAccepted"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Avalanche(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getBuyer = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.bid.bidder;
        }
        return event.returnValues.buyer;
    };

    _getPaymentToken = async (event: EventData): Promise<string> => {
        if (event.event === "TokenBidAccepted") {
            const paymentTokenCall = await this.sdk.callContractMethod("paymentToken");
            return paymentTokenCall.toLowerCase();
        }

        return "avax";
    };

    _getNativePrice = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.bid.value;
        }

        return event.returnValues.listing.value;
    };

    _getSeller = (event: EventData): string => {
        if (event.event === "TokenBidAccepted") {
            return event.returnValues.seller;
        }
        return event.returnValues.listing.seller;
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = this._getBuyer(event);
        if (!buyer) {
            return;
        }
        const paymentToken = await this._getPaymentToken(event);
        const tokenId = event.returnValues.tokenId;
        const seller = this._getSeller(event);
        const nftContract = event.returnValues.erc721Address.toLowerCase();
        const { paymentTokenSymbol, priceInCrypto, priceInUsd } = await getPaymentData(
            this.protocol,
            paymentToken,
            this._getNativePrice(event),
            timestamp,
        );

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract,
            nftId: tokenId,
            token: paymentToken,
            tokenSymbol: paymentTokenSymbol,
            amount: 1,
            price: priceInCrypto,
            priceUsd: priceInUsd,
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default NFTKey;
