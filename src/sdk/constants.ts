require("dotenv").config();

enum AVAILABLE_PROTOCOLS {
    ETH = "ethereum",
    BSC = "bsc",
    POLYGON = "polygon",
    AVALANCHE = "avalanche",
    TEZOS = "tezos",
}

const API_KEY = process.env.DAPPRADAR_API_KEY || "";
if (!API_KEY.length) throw new Error(`Missing "API_KEY" environment variable`);

const API_URL = process.env.DAPPRADAR_API_URL || "";
if (!API_URL.length) throw new Error(`Missing "API_URL" environment variable`);

const WS_PROXY_URL = process.env.WS_PROXY_URL || "";
if (!WS_PROXY_URL.length) throw new Error(`Missing "WS_PROXY_URL" environment variable`);

const HTTP_PROXY_URL = process.env.HTTP_PROXY_URL || "";
if (!HTTP_PROXY_URL.length) throw new Error(`Missing "HTTP_PROXY_URL" environment variable`);

const DEFAULT_MAX_RETRIES = 10;

export { AVAILABLE_PROTOCOLS, API_KEY, API_URL, WS_PROXY_URL, HTTP_PROXY_URL, DEFAULT_MAX_RETRIES };
