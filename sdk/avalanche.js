require("dotenv").config();
const { AVAILABLE_PROTOCOLS } = require("./constants");

const EVMC = require("./EVMC");

module.exports = class kalao_avalanche extends EVMC {
    constructor(props) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.kalao_avalanche;
    }
};
