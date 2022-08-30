"use strict";
exports.__esModule = true;
exports.DEFAULT_MAX_RETRIES = exports.HTTP_PROXY_URL = exports.WS_PROXY_URL = exports.API_URL = exports.API_KEY = exports.AVAILABLE_PROTOCOLS = void 0;
require("dotenv").config();
var AVAILABLE_PROTOCOLS;
(function (AVAILABLE_PROTOCOLS) {
    AVAILABLE_PROTOCOLS["ETH"] = "ethereum";
    AVAILABLE_PROTOCOLS["BSC"] = "bsc";
    AVAILABLE_PROTOCOLS["POLYGON"] = "polygon";
    AVAILABLE_PROTOCOLS["AVALANCHE"] = "avalanche";
    AVAILABLE_PROTOCOLS["TEZOS"] = "tezos";
})(AVAILABLE_PROTOCOLS || (AVAILABLE_PROTOCOLS = {}));
exports.AVAILABLE_PROTOCOLS = AVAILABLE_PROTOCOLS;
var API_KEY = process.env.DAPPRADAR_API_KEY || "";
exports.API_KEY = API_KEY;
var API_URL = process.env.DAPPRADAR_API_URL || "";
exports.API_URL = API_URL;
var WS_PROXY_URL = process.env.WS_PROXY_URL || "";
exports.WS_PROXY_URL = WS_PROXY_URL;
var HTTP_PROXY_URL = process.env.HTTP_PROXY_URL || "";
exports.HTTP_PROXY_URL = HTTP_PROXY_URL;
if (!API_KEY.length)
    throw new Error("Missing \"API_KEY\" environment variable");
if (!API_URL.length)
    throw new Error("Missing \"API_URL\" environment variable");
if (!WS_PROXY_URL.length)
    throw new Error("Missing \"WS_PROXY_URL\" environment variable");
if (!HTTP_PROXY_URL.length)
    throw new Error("Missing \"HTTP_PROXY_URL\" environment variable");
var DEFAULT_MAX_RETRIES = 10;
exports.DEFAULT_MAX_RETRIES = DEFAULT_MAX_RETRIES;
