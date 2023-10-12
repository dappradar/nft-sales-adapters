import axios from "axios";
import {API_KEY, API_URL} from "../constants";

export interface IChainData {
    id: number;
    key: string;
    addressCaseSensitive: boolean;
}

export default async (chainId: number): Promise<IChainData> => {
    try {
        const {data} = await axios({
            method: "GET",
            url: `${API_URL}/chains`,
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!data.results) {
            throw new Error("Unable to fetch chains data");
        }

        if (!data.results[chainId]) {
            throw new Error(`Unknown chain ID "${chainId}"`);
        }

        return data.results[chainId];
    } catch (err) {
        const statusCode = err?.response?.status;

        if (401 === statusCode) {
            const message = err.response?.data?.message[0];
            console.error(`${message.reason} (${statusCode}): ${message?.message}`);
            process.exit(1);
        }

        if (500 === statusCode) {
            console.error(`${err.response?.data?.message} (${statusCode}): Unexpected issue with an API. Contact our team or try again later.`);
            process.exit(1);
        }

        throw err;
    }
};
