import * as dotenv from "dotenv";

dotenv.config();

import {AVAILABLE_PROTOCOLS} from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Elysium extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.ELYSIUM;
        this.chainId = 58;
        this.node = process.env.ELYSIUM_NODE_HTTP;
    }
}

export default Elysium;
