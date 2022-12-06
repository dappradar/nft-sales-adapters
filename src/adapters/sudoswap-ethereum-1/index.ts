// @todo use getPaymentData

import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

import moment from "moment";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/EVMC";
import priceSdk from "../../sdk/price";
import {Transaction} from "web3-core";
import symbolSdk from "../../sdk/symbol";
import {Contract} from "web3-eth-contract";
import {asyncTimeout} from "../../sdk/util";
import {BlockTransactionString} from "web3-eth";
import InputDataDecoder from "ethereum-input-data-decoder";
import {ISaleEntity, ISymbolAPIResponse} from "../../sdk/Interfaces";

dotenv.config();

export class PairData {
    private _sdk: Ethereum;
    private _data: Array<[[string, { type: string; hex: string }[]], object | null]>;
    private _nftBuyer: string;
    private _isAnyNFT: boolean;
    private _isBuyCall: boolean;

    constructor(
        sdk: Ethereum,
        data: Array<[[string, { type: string; hex: string }[]], object | null]>,
        nftBuyer: string,
        isBuyCall: boolean,
        isAnyNFT: boolean,
    ) {
        this._sdk = sdk;
        this._data = data;
        this._nftBuyer = nftBuyer;
        this._isAnyNFT = isAnyNFT;
        this._isBuyCall = isBuyCall;
    }

    getNumberOfNFTs(idx: number): number {
        if (this._isAnyNFT) {
            return this._sdk.web3.utils.hexToNumber(this._data[idx][0][1][0].hex);
        }
        return this._data[idx][0][1].length;
    }

    getNfts(idx: number): { contract: string; id: string; amount: number }[] {
        const pairAddress = this.pairAddress(idx);

        if (this._isAnyNFT) {
            return [
                {
                    contract: pairAddress,
                    id: new BigNumber(this._data[idx][0][1][0].hex, 16).toFixed(),
                    amount: 1,
                },
            ];
        }

        const nftIds = [];
        for (let i = 0; i < this._data[idx][0][1].length; i++) {
            nftIds.push({
                contract: pairAddress,
                id: new BigNumber(this._data[idx][0][1][i].hex, 16).toFixed(),
                amount: 1,
            });
        }

        return nftIds;
    }

    pairAddress(idx: number): string {
        return this._sdk.hexToAddress(this._data[idx][0][0]);
    }

    get info(): {
        buyer: string;
        pairAddress: string;
        nfts: { contract: string; id: string; amount: number }[];
        amount: number;
        isBuyCall: boolean;
    }[] {
        const pairInfo = [];
        for (let idx = 0; idx < this._data.length; idx++) {
            pairInfo.push({
                buyer: this._nftBuyer,
                pairAddress: this.pairAddress(idx),
                nfts: this.getNfts(idx),
                amount: this.getNumberOfNFTs(idx),
                isBuyCall: this._isBuyCall,
            });
        }

        return pairInfo;
    }
}

class SudoSwap {
    name: string;
    symbol: ISymbolAPIResponse | undefined;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    searchType: string;
    events: string[];
    pathToAbi: string | undefined;
    blockRange: number;
    chunkSize: number;
    sdk: Ethereum;

    decoder: InputDataDecoder;
    ethAddress: string;
    pairFactoryAbi: string;
    pairFactoryAddress: string;
    pairContractAbi: string;
    bondingCurveContractAbi: string;

    constructor() {
        this.name = "sudoswap-ethereum-1";
        this.symbol = undefined;
        this.token = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        this.protocol = "ethereum";
        this.block = 14718943;
        this.contract = "0x2b2e8cda09bba9660dca5cb6233787738ad68329";
        this.pathToAbi = path.join(__dirname, "./abis/PairRouter.json");
        this.blockRange = 5;
        this.searchType = "block-scan";

        this.pairFactoryAddress = "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4";
        this.pairContractAbi = path.join(__dirname, "./abis/PairETH.json");
        this.bondingCurveContractAbi = path.join(__dirname, "./abis/BondingCurve.json");
        this.pairFactoryAbi = path.join(__dirname, "./abis/PairFactory.json");

        this.decoder = new InputDataDecoder(JSON.parse(fs.readFileSync(this.pathToAbi, "utf8")));

        this.sdk = new Ethereum(this);
    }

    loadSdk = async () => {
        return new Ethereum(this);
    };

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);

        this.symbol = symbol;

        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getExternalAbi = async (pathToAbi: string): Promise<object> => {
        const stringifiedAbi: string = await fs.promises.readFile(pathToAbi, "utf8");
        return JSON.parse(stringifiedAbi || "[]");
    };

    _getExternalContract = async (abi: object, contract_address: string): Promise<Contract> => {
        const web3 = this.sdk.ensureWeb3();

        return new web3.eth.Contract(abi, contract_address);
    };

    _callExternalContractMethod = async (
        contract_address: string,
        abi: string,
        methodName: string,
        blockNumber: number,
        params: any[] = [],
    ): Promise<any> => {
        const callback = async () => {
            this.sdk.ensureWeb3();
            const contract_abi = await this._getExternalAbi(abi);
            const contract = await this._getExternalContract(contract_abi, contract_address);
            contract.defaultBlock = blockNumber - 1;

            const response = await contract.methods[methodName](...params).call();

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.sdk.retry({
            callback,
            customParams: {
                methodName,
                params,
            },
        });
    };

    _getPrice = async (
        pair_address: string,
        amount: number,
        isBuyCall: boolean,
        block: BlockTransactionString,
    ): Promise<{ price: number | null; priceUsd: number | null }> => {
        const po = await priceSdk.get(this.token, this.protocol, moment.unix(+block.timestamp));

        const pairFee = await this._callExternalContractMethod(pair_address, this.pairContractAbi, "fee", block.number);
        const pairSpotPrice = await this._callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "spotPrice",
            block.number,
        );
        const pairDelta = await this._callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "delta",
            block.number,
        );
        const pairBondingCurve = await this._callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "bondingCurve",
            block.number,
        );
        const factoryFeeMultiplier = await this._callExternalContractMethod(
            this.pairFactoryAddress,
            this.pairFactoryAbi,
            "protocolFeeMultiplier",
            block.number,
        );

        let functionCall = "getSellInfo";
        if (isBuyCall) {
            functionCall = "getBuyInfo";
        }

        const buyInfo = await this._callExternalContractMethod(
            pairBondingCurve,
            this.bondingCurveContractAbi,
            functionCall,
            block.number,
            [pairSpotPrice, pairDelta, amount, pairFee, factoryFeeMultiplier],
        );

        const priceInEth = buyInfo[3];
        const nativePrice = new BigNumber(priceInEth).dividedBy(10 ** (this.symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: !this.symbol?.decimals ? null : nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    _decodeData = async (input: string): Promise<PairData[] | null> => {
        let pairData = null;

        const data = this.decoder.decodeData(input);

        switch (data.method) {
            case "robustSwapNFTsForToken":
                pairData = [new PairData(this.sdk, data.inputs[0], data.inputs[1], false, false)];
                break;
            case "robustSwapERC20ForAnyNFTs":
                pairData = [new PairData(this.sdk, data.inputs[0], data.inputs[2], true, true)];
                break;
            case "robustSwapERC20ForSpecificNFTs":
                pairData = [new PairData(this.sdk, data.inputs[0], data.inputs[3], true, false)];
                break;
            case "robustSwapERC20ForSpecificNFTsAndNFTsToToken":
                break;
            case "robustSwapETHForAnyNFTs":
                pairData = [new PairData(this.sdk, data.inputs[0], data.inputs[2], true, true)];
                break;
            case "robustSwapETHForSpecificNFTs":
                pairData = [new PairData(this.sdk, data.inputs[0], data.inputs[2], true, false)];
                break;
            case "robustSwapETHForSpecificNFTsAndNFTsToToken":
                break;
            case "swapERC20ForAnyNFTs":
                pairData = [new PairData(this.sdk, [data.inputs[0]], data.inputs[2], true, true)];
                break;
            case "swapERC20ForSpecificNFTs":
                pairData = [new PairData(this.sdk, [data.inputs[0]], data.inputs[2], true, false)];
                break;
            case "swapETHForAnyNFTs":
                pairData = [new PairData(this.sdk, [data.inputs[0]], data.inputs[2], true, true)];
                break;
            case "swapETHForSpecificNFTs":
                pairData = [new PairData(this.sdk, [data.inputs[0]], data.inputs[2], true, false)];
                break;
            case "swapNFTsForAnyNFTsThroughERC20":
                break;
            case "swapNFTsForAnyNFTsThroughETH":
                break;
            case "swapNFTsForSpecificNFTsThroughERC20":
                break;
            case "swapNFTsForSpecificNFTsThroughETH":
                break;
            case "swapNFTsForToken":
                pairData = [new PairData(this.sdk, [data.inputs[0]], data.inputs[2], false, false)];
                break;
        }

        return pairData;
    };

    process = async (transaction: Transaction): Promise<ISaleEntity | undefined> => {
        if (!transaction.blockNumber) return;

        const block = await this.sdk.getBlock(transaction.blockNumber);
        const timestamp = moment.unix(block.timestamp as number).utc();

        const pairData = await this._decodeData(transaction.input);

        if (!pairData) return;

        for (const pair of pairData) {
            for (const pairInfo of pair.info) {
                const { price, priceUsd } = await this._getPrice(
                    pairInfo.pairAddress,
                    pairInfo.amount,
                    pairInfo.isBuyCall,
                    block,
                );

                console.log(`Price: ${price}, pair: ${pairInfo.pairAddress}, NftId: ${pairInfo.nfts}`);
                console.log(`transaction Hash: ${transaction.hash}`);

                const entity: ISaleEntity = {
                    providerName: this.name,
                    providerContract: this.contract.toLowerCase(),
                    protocol: this.protocol,
                    nfts: pairInfo.nfts,
                    token: this.token.toLowerCase(),
                    tokenSymbol: this.symbol?.symbol || "",
                    price,
                    priceUsd,
                    seller: pairInfo.pairAddress.toLowerCase(),
                    buyer: pairInfo.buyer.toLowerCase(),
                    soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
                    blockNumber: <number>transaction.blockNumber,
                    transactionHash: transaction.hash,
                };

                await this.addToDatabase(entity);
            }
        }

        return;
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default SudoSwap;
