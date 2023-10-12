enum AVAILABLE_PROTOCOLS {
    ETH = "ethereum",
    BSC = "binance-smart-chain",
    POLYGON = "polygon",
    AVALANCHE = "avalanche",
    TEZOS = "tezos",
    AURORA = "aurora",
    CELO = "celo",
    MOONBEAM = "moonbeam",
    MOONRIVER = "moonriver",
}

const API_KEY = process.env.DAPPRADAR_API_KEY || "";
const API_URL = process.env.DAPPRADAR_API_URL || "";
const WS_PROXY_URL = process.env.WS_PROXY_URL || "";
const HTTP_PROXY_URL = process.env.HTTP_PROXY_URL || "";

if (!API_KEY.length) {
    console.error(`Missing "API_KEY" environment variable`);
}
if (!API_URL.length) throw new Error(`Missing "API_URL" environment variable`);
if (!WS_PROXY_URL.length) throw new Error(`Missing "WS_PROXY_URL" environment variable`);
if (!HTTP_PROXY_URL.length) throw new Error(`Missing "HTTP_PROXY_URL" environment variable`);

const DEFAULT_MAX_RETRIES = 10;

export { AVAILABLE_PROTOCOLS, API_KEY, API_URL, WS_PROXY_URL, HTTP_PROXY_URL, DEFAULT_MAX_RETRIES };
