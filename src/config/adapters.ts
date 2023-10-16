import {IBasicProviderOptions} from "../sdk/basic-provider";

const ETHEREUM: IBasicProviderOptions[] = [
    {
        name: "element-ethereum-1",
        basicProvider: "element-bp-1",
        block: 15080677,
        deprecatedAt: 15794002,
        contract: "0x20f780a973856b93f63670377900c1d2a50a77c4",
        chainId: 1,
        defaultPaymentToken: "0x0000000000000000000000000000000000000000",
    },
    {
        name: "element-ethereum-2",
        basicProvider: "element-bp-2",
        block: 15794002,
        contract: "0x20f780a973856b93f63670377900c1d2a50a77c4",
        chainId: 1,
        defaultPaymentToken: "0x0000000000000000000000000000000000000000",
    },
    {
        name: "nftrade-ethereum-1",
        basicProvider: "nftrade-bp-1",
        block: 15554697,
        contract: "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3",
        chainId: 1,
        defaultPaymentToken: "eth",
    },
];

const BSC: IBasicProviderOptions[] = [
    {
        name: "element-bsc-1",
        basicProvider: "element-bp-1",
        block: 16968105,
        deprecatedAt: 22357101,
        contract: "0xb3e3dfcb2d9f3dde16d78b9e6eb3538eb32b5ae1",
        chainId: 15,
        defaultPaymentToken: "bnb",
    },
    {
        name: "element-bsc-2",
        basicProvider: "element-bp-2",
        block: 22357101,
        contract: "0xb3e3dfcb2d9f3dde16d78b9e6eb3538eb32b5ae1",
        chainId: 15,
        defaultPaymentToken: "bnb",
    },
    {
        name: "nftrade-bsc-1",
        basicProvider: "nftrade-bp-1",
        block: 21416323,
        contract: "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3",
        chainId: 15,
        defaultPaymentToken: "bnb",
    },
];

const POLYGON: IBasicProviderOptions[] = [
    {
        name: "element-matic-1",
        basicProvider: "element-bp-1",
        block: 27168140,
        deprecatedAt: 34601844,
        contract: "0xeaf5453b329eb38be159a872a6ce91c9a8fb0260",
        chainId: 16,
        defaultPaymentToken: "matic",
    },
    {
        name: "element-matic-2",
        basicProvider: "element-bp-2",
        block: 36047022,
        contract: "0xeaf5453b329eb38be159a872a6ce91c9a8fb0260",
        chainId: 16,
        defaultPaymentToken: "matic",
    },
    {
        name: "nftrade-polygon-1",
        basicProvider: "nftrade-bp-1",
        block: 33227140,
        contract: "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3",
        chainId: 16,
        defaultPaymentToken: "matic",
    },
];

const AVALANCHE: IBasicProviderOptions[] = [
    {
        name: "element-avalanche-1",
        basicProvider: "element-bp-1",
        block: 13749004,
        deprecatedAt: 21333894,
        contract: "0x18cd9270dbdca86d470cfb3be1b156241fffa9de",
        chainId: 19,
        defaultPaymentToken: "avax",
    },
    {
        name: "element-avalanche-2",
        basicProvider: "element-bp-2",
        block: 21333894,
        contract: "0x18cd9270dbdca86d470cfb3be1b156241fffa9de",
        chainId: 19,
        defaultPaymentToken: "avax",
    },
    {
        name: "nftrade-avalanche-1",
        basicProvider: "nftrade-bp-1",
        block: 19958164,
        contract: "0xbf6bfe5d6b86308cf3b7f147dd03ef11f80bfde3",
        chainId: 19,
        defaultPaymentToken: "avax",
    },
];

export const ADAPTERS = [
    ...ETHEREUM,
    ...BSC,
    ...POLYGON,
    ...AVALANCHE
]