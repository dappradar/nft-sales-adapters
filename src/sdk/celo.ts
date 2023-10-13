import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Celo extends EVMC_HTTP {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.CELO;
        this.chainId = 43;
        this.node = process.env.CELO_NODE_HTTP;
    }
}

export default Celo;
