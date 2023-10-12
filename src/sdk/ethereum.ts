import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Ethereum extends EVMC_HTTP {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.ETH;
        this.chainId = 1;
        this.node = process.env.ETHEREUM_NODE_HTTP;
    }
}

export default Ethereum;
