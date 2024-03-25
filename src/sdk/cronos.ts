import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Cronos extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.CRONOS;
        this.chainId = 37;
        this.node = process.env.CRONOS_NODE_HTTP;
    }
}

export default Cronos;
