require("dotenv").config();
const { AVAILABLE_PROTOCOLS } = require("./constants");

const EVMC = require("./EVMC");

module.exports = class Avalanche extends EVMC {
    constructor(props) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.AVALANCHE;
    }
};
