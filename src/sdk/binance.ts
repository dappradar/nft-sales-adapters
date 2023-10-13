import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class BSC extends EVMC_HTTP {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.BSC;
        this.chainId = 15;
        this.node = process.env.BSC_NODE_HTTP;
    }
}

export default BSC;
