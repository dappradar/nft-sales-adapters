require("dotenv").config();
const axios = require("axios");
const { asyncTimeout, HTTP_PROXY_URL, AVAILABLE_PROTOCOLS } = require("./util");
const _ = require("lodash");

const key = process.env.DAPPRADAR_API_KEY;
const headers = {
    key,
    protocol: AVAILABLE_PROTOCOLS.TEZOS,
    "content-type": "application/json",
};

class Tezos {
    constructor(provider) {
        this.provider = provider;
        this.range = 500; // Maximum amount that API can handle is 500
        this.chunkSize = 10;
    }

    run = async () => {
        await this.calls();
    };

    calls = async () => {
        while (true) {
            const calls = await this.getCalls(0);
            const chunks = _.chunk(calls, this.chunkSize);
            for (const chunk in chunks) {
                const promises = [];
                for (const call of chunks[chunk]) {
                    promises.push(this.provider.process(call, 0));
                }

                await Promise.all(promises);
            }

            if (calls.length < this.range) {
                await asyncTimeout(60);
            }
        }
    };

    getCalls = async offset => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                const url = `${HTTP_PROXY_URL}/operations/transactions`;

                const response = await axios.get(url, {
                    params: {
                        target: this.provider.contract,
                        entrypoint: this.provider.event,
                        limit: this.range,
                        offset,
                    },
                    headers,
                });

                return response.data;
            } catch (err) {
                error = {
                    action: "Get calls",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getCalls",
                    event: this.provider.event,
                    limit: this.range,
                    offset,
                };
                console.log(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    getOperation = async hash => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                const url = `${HTTP_PROXY_URL}/operations/${hash}`;
                const response = await axios.get(url, {
                    headers,
                });

                return response.data;
            } catch (err) {
                error = {
                    action: "Get operations",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getOperations",
                    event: this.provider.event,
                    limit: this.range,
                    hash,
                };
                console.log(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };
}

module.exports = Tezos;
