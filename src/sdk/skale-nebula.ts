import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class SkaleNebula extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.SKALE_NEBULA;
        this.chainId = 87;
        this.node = process.env.SKALE_NEBULA_NODE_HTTP;
        this.range = 2000;
    }
}

export default SkaleNebula;
