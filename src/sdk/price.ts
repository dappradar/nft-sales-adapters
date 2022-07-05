import axios from "axios";
import { API_KEY, API_URL } from "./constants";

import { IPriceAPIResponse } from "./Interfaces";

const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36";

class Price {
    get = async (token: string, protocol: string, timestamp: number): Promise<IPriceAPIResponse> => {
        const url = `${API_URL}/token-price`;
        const config = {
            params: {
                key: API_KEY,
                token_address: token,
                protocol,
                timestamp,
            },
            headers: {
                "User-Agent": USER_AGENT,
            },
        };
        const resp = await axios.get(url, config);

        return resp.data;
    };
}

export default new Price();
