import * as dotenv from "dotenv";

dotenv.config();

import {AVAILABLE_PROTOCOLS} from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class ZksyncEra extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.ZKSYNC_ERA;
        this.chainId = 93;
        this.node = process.env.ZKSYNC_ERA_NODE_HTTP;
    }
}

export default ZksyncEra;
