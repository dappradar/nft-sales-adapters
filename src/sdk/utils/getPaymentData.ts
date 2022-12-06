import symbolSdk from "../symbol";
import { Moment } from "moment";
import BigNumber from "bignumber.js";
import priceSdk from "../price";

interface IPaymentTokenData {
    token: string;
    symbol: string | null;
    decimals: number | null;
}

interface IPaymentData {
    paymentToken: string;
    paymentTokenSymbol: string;
    priceInCrypto: string;
    priceInUsd: string | null;
}

const _getPaymentTokenData = async (protocol: string, token: string): Promise<IPaymentTokenData> => {
    const response = await symbolSdk.get(token, protocol);

    if (!response) {
        return {
            token,
            symbol: null,
            decimals: null,
        };
    }

    return {
        token,
        symbol: response.symbol,
        decimals: +response.decimals,
    };
};

const getPaymentData = async (
    protocol: string,
    paymentToken: string,
    rawNativePrice: string | BigNumber,
    time: Moment,
): Promise<IPaymentData> => {
    const tokenData = await _getPaymentTokenData(protocol, paymentToken);

    let nativePrice: BigNumber;
    if (rawNativePrice instanceof BigNumber) {
        nativePrice = rawNativePrice;
    } else {
        nativePrice = new BigNumber(rawNativePrice);
    }

    const response: IPaymentData = {
        paymentToken,
        paymentTokenSymbol: tokenData.symbol || "",
        priceInCrypto: nativePrice.toString(),
        priceInUsd: null,
    };

    if (null !== tokenData.decimals) {
        const price = nativePrice.dividedBy(10 ** tokenData.decimals);
        const tokenPriceUsd = await priceSdk.get(paymentToken, protocol, time);

        response.priceInCrypto = price.toFixed();
        response.priceInUsd = price.multipliedBy(tokenPriceUsd.price).toFixed();
    }

    return response;
};

export default getPaymentData;
