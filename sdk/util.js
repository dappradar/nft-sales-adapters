require("dotenv").config();
const { AVAILABLE_PROTOCOLS } = require("./constants");
const Web3 = require("web3");
const key = process.env.DAPPRADAR_API_KEY;
const headers = {
    key,
    protocol: AVAILABLE_PROTOCOLS.ETH,
};

//const WS_PROXY_URL = "ws://nft-sales-websocket.dappradar.com";
const WS_PROXY_URL = "wss://rpc-mainnet.matic.quiknode.pro";
// @see https://web3js.readthedocs.io/en/v1.2.11/web3.html#configuration
const options = {
    headers,
    clientConfig: {
        maxReceivedFrameSize: 100 * 1000 * 1000,
        maxReceivedMessageSize: 100 * 1000 * 1000,
    },
    reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 1000,
        onTimeout: false,
    },
};

const asyncTimeout = async (seconds = 10) => new Promise(r => setTimeout(r, 1000 * seconds));
module.exports = { WS_PROXY_URL, options, asyncTimeout, AVAILABLE_PROTOCOLS };
