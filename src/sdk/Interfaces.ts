export interface ISaleEntityNFT {
    contract: string;
    id: string;
    amount: number;
}

export interface ISaleEntity {
    providerName: string;
    providerContract: string;
    protocol: string;
    nfts?: ISaleEntityNFT[];
    nftId?: string;
    nftContract?: string;
    token: string;
    tokenSymbol: string;
    amount?: number;
    price: string | number | null;
    priceUsd: string | number | null;
    seller: string;
    buyer: string;
    soldAt: string;
    blockNumber: number;
    transactionHash: string;
}

export interface IDappRadarAPIHeaders {
    key: string;
    protocol: string;
    "content-type"?: string;
}

export interface ISymbolAPIResponse {
    id: number;
    address: string;
    symbol: string;
    protocol: string;
    decimals: number;
    created_at: string;
    currency: string;
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
