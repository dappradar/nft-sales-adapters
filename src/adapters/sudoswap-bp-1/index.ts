import fs from "fs";
import path from "path";

import moment from "moment";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/ethereum";
import {Transaction} from "web3-core";
import {Contract} from "web3-eth-contract";
import {asyncTimeout} from "../../sdk/utils";
import {BlockTransactionString} from "web3-eth";
import InputDataDecoder from "ethereum-input-data-decoder";
import {ISaleEntity} from "../../sdk/Interfaces";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

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

class SudoSwap extends BasicProvider {
    pathToAbi: string;
    searchType: string;
    defaultPaymentToken: string;

    decoder: InputDataDecoder;
    pairFactoryAbi: string;
    pairFactoryAddress: string;
    pairContractAbi: string;
    bondingCurveContractAbi: string;

    constructor(options: IBasicProviderOptions) {
        super(options);

        this.requireDefaultPaymentToken();
        this.pathToAbi = path.join(__dirname, "./abis/PairRouter.json");
        this.searchType = "block-scan";
        this.pairFactoryAddress = "0xb16c1342e617a5b6e4b631eb114483fdb289c0a4";
        this.pairContractAbi = path.join(__dirname, "./abis/PairETH.json");
        this.bondingCurveContractAbi = path.join(__dirname, "./abis/BondingCurve.json");
        this.pairFactoryAbi = path.join(__dirname, "./abis/PairFactory.json");

        this.decoder = new InputDataDecoder(JSON.parse(fs.readFileSync(this.pathToAbi, "utf8")));
    }

    private getExternalAbi = async (pathToAbi: string): Promise<object> => {
        const stringifiedAbi: string = await fs.promises.readFile(pathToAbi, "utf8");

        return JSON.parse(stringifiedAbi || "[]");
    };

    private getExternalContract = async (abi: object, contract_address: string): Promise<Contract> => {
        const web3 = this.sdk.ensureWeb3();

        return new web3.eth.Contract(abi, contract_address);
    };

    private callExternalContractMethod = async (
        contract_address: string,
        abi: string,
        methodName: string,
        blockNumber: number,
        params: any[] = [],
    ): Promise<any> => {
        const callback = async () => {
            this.sdk.ensureWeb3();
            const contract_abi = await this.getExternalAbi(abi);
            const contract = await this.getExternalContract(contract_abi, contract_address);
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

    private getPrice = async (
        pair_address: string,
        amount: number,
        isBuyCall: boolean,
        block: BlockTransactionString,
    ): Promise<BigNumber> => {
        const pairFee = await this.callExternalContractMethod(pair_address, this.pairContractAbi, "fee", block.number);
        const pairSpotPrice = await this.callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "spotPrice",
            block.number,
        );
        const pairDelta = await this.callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "delta",
            block.number,
        );
        const pairBondingCurve = await this.callExternalContractMethod(
            pair_address,
            this.pairContractAbi,
            "bondingCurve",
            block.number,
        );
        const factoryFeeMultiplier = await this.callExternalContractMethod(
            this.pairFactoryAddress,
            this.pairFactoryAbi,
            "protocolFeeMultiplier",
            block.number,
        );

        let functionCall = "getSellInfo";
        if (isBuyCall) {
            functionCall = "getBuyInfo";
        }

        const buyInfo = await this.callExternalContractMethod(
            pairBondingCurve,
            this.bondingCurveContractAbi,
            functionCall,
            block.number,
            [pairSpotPrice, pairDelta, amount, pairFee, factoryFeeMultiplier],
        );

        return new BigNumber(buyInfo[3]);
    };

    private decodeData = async (input: string): Promise<PairData[] | null> => {
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

    process = async (transaction: Transaction): Promise<ISaleEntity[] | undefined> => {
        if (!transaction.blockNumber) return;

        const block = await this.sdk.getBlock(transaction.blockNumber);
        const timestamp = moment.unix(block.timestamp as number).utc();

        const pairData = await this.decodeData(transaction.input);

        if (!pairData) return;

        const sales: ISaleEntity[] = [];

        for (const pair of pairData) {
            for (const pairInfo of pair.info) {
                const price = await this.getPrice(pairInfo.pairAddress, pairInfo.amount, pairInfo.isBuyCall, block);

                console.log(`Price: ${price}, pair: ${pairInfo.pairAddress}, NftId: ${pairInfo.nfts}`);
                console.log(`transaction Hash: ${transaction.hash}`);

                const entity: ISaleEntity = {
                    providerName: this.name,
                    providerContract: this.contract.toLowerCase(),
                    nfts: pairInfo.nfts,
                    token: this.defaultPaymentToken.toLowerCase(),
                    price,
                    seller: pairInfo.pairAddress.toLowerCase(),
                    buyer: pairInfo.buyer.toLowerCase(),
                    soldAt: timestamp,
                    blockNumber: <number>transaction.blockNumber,
                    transactionHash: transaction.hash,
                    chainId: this.sdk.chainId,
                };

                sales.push(await this.addToDatabase(entity));
            }
        }

        return sales;
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default SudoSwap;
