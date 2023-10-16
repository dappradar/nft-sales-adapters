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
    nfts: ISaleEntityNFT[];
    token: string;
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

export interface IObjectStringAny {
    [key: string]: any;
}

export interface IObjectNumberString {
    [key: number]: string
}
