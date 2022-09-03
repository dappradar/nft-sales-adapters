import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";

import moment from "moment";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/EVMC";
import priceSdk from "../../sdk/price";
import { Transaction } from "web3-core";
import symbolSdk from "../../sdk/symbol";
import { Contract } from "web3-eth-contract";
import { asyncTimeout } from "../../sdk/util";
import { BlockTransactionString } from "web3-eth";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

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
    range: number;
    chunkSize: number;
    sdk: Ethereum;

    ethAddress: string;
    pairFactoryAbi: string;
    pairFactoryAddress: string;
    pairContractAbi: string;
    bondingCurveContractAbi: string;

    constructor() {
        this.name = "sudoswap";
        this.symbol = undefined;
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "ethereum";
        this.block = 14718842;
        this.contract = "0x2b2e8cda09bba9660dca5cb6233787738ad68329";
        this.pathToAbi = path.join(__dirname, "./abis/PairRouter.json");
        this.range = 500;

        this.ethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        this.pairFactoryAddress = "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4";
        this.pairContractAbi = path.join(__dirname, "./abis/PairETH.json");
        this.bondingCurveContractAbi = path.join(__dirname, "./abis/BondingCurve.json");
        this.pairFactoryAbi = path.join(__dirname, "./abis/PairFactory.json");

        this.sdk = new Ethereum(this);
    }

    loadSdk = async () => {
        return new Ethereum(this);
    };

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getExternalAbi = async (pathToAbi: string): Promise<object> => {
        const stringifiedAbi: string = await fs.promises.readFile(pathToAbi, "utf8");
        const abi: object = JSON.parse(stringifiedAbi || "[]");

        return abi;
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
        symbol: ISymbolAPIResponse,
        block: BlockTransactionString,
    ): Promise<{ price: number | null; priceUsd: number | null }> => {
        const po = await priceSdk.get(this.ethAddress, this.protocol, +block.timestamp);

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
            pair_address,
            this.pairFactoryAbi,
            "protocolFeeMultiplier",
            block.number,
        );

        const buyInfo = await this._callExternalContractMethod(
            pairBondingCurve,
            this.bondingCurveContractAbi,
            "spotPrice",
            block.number,
            [pairSpotPrice, pairDelta, 1, pairFee, factoryFeeMultiplier],
        );

        if (!symbol?.decimals) {
            return {
                price: null,
                priceUsd: null,
            };
        }

        const priceInEth = buyInfo[3];
        const nativePrice = new BigNumber(priceInEth).dividedBy(10 ** (symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (transaction: Transaction): Promise<ISaleEntity | undefined> => {
        if (!transaction.blockNumber) return;

        const block = await this.sdk.getBlock(transaction.blockNumber);
        const timestamp = moment.unix(block.timestamp as number).utc();

        const receipt = await this.sdk.getTransactionReceipt(transaction.hash);

        const transferLogs = receipt.logs.filter(
            (log: any) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        );

        for (const transfer of transferLogs) {
            const nftBuyer = this.sdk.hexToAddress(transfer.topics[1]);
            const pairAddress = this.sdk.hexToAddress(transfer.topics[2]);
            const nftNumber = this.sdk.web3.utils.hexToNumber(transfer.topics[3]);

            const symbol = await symbolSdk.get(this.ethAddress, this.protocol);
            const { price, priceUsd } = await this._getPrice(pairAddress, symbol, block);

            const entity: ISaleEntity = {
                providerName: this.name,
                providerContract: this.contract,
                protocol: this.protocol,
                nftContract: transfer.address.toLowerCase(),
                nftId: nftNumber,
                token: this.token,
                tokenSymbol: this.symbol?.symbol || "",
                amount: 1,
                price: price,
                priceUsd: priceUsd,
                seller: pairAddress.toLowerCase(),
                buyer: nftBuyer.toLowerCase(),
                soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
                blockNumber: <number>transaction.blockNumber,
                transactionHash: transaction.hash,
            };

            await this.addToDatabase(entity);
        }

        return;
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default SudoSwap;
