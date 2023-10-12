import BigNumber from "bignumber.js";
import { Moment } from "moment";

export interface ISaleEntityNFT {
    contract: string;
    id: string;
    amount: number;
}

export interface ISaleEntityNFTTest {
    contract: string;
    id: string;
    amount: number;
    addressCaseSensitive: boolean;
}

export interface ISaleEntity {
    providerName: string;
    providerContract: string;
    protocol: string;
    nfts?: ISaleEntityNFT[];
    nftId?: string;
    nftContract?: string;
    token: string;
    amount?: number;
    price: BigNumber;
    seller: string;
    buyer: string;
    soldAt: Moment;
    blockNumber: number;
    transactionHash: string;
    chainId: number;
}

export interface ISaleEntityTest {
    nfts?: ISaleEntityNFTTest[];
    addressCaseSensitive: boolean;
}

export interface IDappRadarAPIHeaders {
    key: string;
    protocol: string;
    "content-type"?: string;
}

export interface IPriceAPIResponse {
    protocol: string;
    token: string;
    date: string;
    price: number;
    decimals: number | null;
    currency: string;
}

export interface IObjectStringAny {
    [key: string]: any;
}
