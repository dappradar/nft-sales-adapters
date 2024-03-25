import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Aurora extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.AURORA;
        this.chainId = 50;
        this.node = process.env.AURORA_NODE_HTTP;
    }
}

export default Aurora;
