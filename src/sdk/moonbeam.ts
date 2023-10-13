import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Moonbeam extends EVMC_HTTP {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.MOONBEAM;
        this.chainId = 39;
        this.node = process.env.MOONBEAM_NODE_HTTP;
    }
}

export default Moonbeam;
