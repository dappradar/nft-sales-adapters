import { Moment } from "moment";
import BigNumber from "bignumber.js";
import axios from "axios";
import { API_KEY, API_URL } from "../constants";

interface IPaymentData {
    paymentTokenSymbol: string | null;
    priceInCrypto: string;
    priceInUsd: string | null;
}

const getPrice = async (contract: string, chainId: number, time: Moment) => {
    const res = await axios({
        method: "GET",
        url: `${API_URL}/token-price`,
        params: {
            contract,
            chainId,
            timestamp: time.unix(),
        },
        headers: {
            'x-api-key': API_KEY,
        },
    });

    return res.data.results;
};

const getPaymentData = async (
    chainId: number,
    token: string,
    rawNativePrice: string | BigNumber,
    time: Moment,
): Promise<IPaymentData> => {
    let nativePrice: BigNumber;

    if (rawNativePrice instanceof BigNumber) {
        nativePrice = rawNativePrice;
    } else {
        if (rawNativePrice.length > 1 && rawNativePrice.startsWith("00")) {
            nativePrice = new BigNumber(rawNativePrice, 16);
        } else {
            nativePrice = new BigNumber(rawNativePrice);
        }
    }

    const priceResponse = await getPrice(token, chainId, time);

    if (!priceResponse) {
        return {
            paymentTokenSymbol: null,
            priceInCrypto: nativePrice.toString(),
            priceInUsd: null,
        };
    }

    if (null === priceResponse.decimals) {
        return {
            paymentTokenSymbol: priceResponse.symbol,
            priceInCrypto: nativePrice.toString(),
            priceInUsd: null,
        };
    }

    let price = nativePrice;
    let priceInUsd = null;

    if (priceResponse.decimals > 0) {
        price = nativePrice.dividedBy(10 ** priceResponse.decimals);
    }

    if (priceResponse.price) {
        priceInUsd = price.multipliedBy(priceResponse.price).toFixed();
    }

    return {
        paymentTokenSymbol: priceResponse.symbol,
        priceInCrypto: price.toFixed(),
        priceInUsd,
    };
};

export default getPaymentData;
