import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC from "./EVMC";

class Avalanche extends EVMC {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.AVALANCHE;
        this.chainId = 19;
        this.node = process.env.AVALANCHE_NODE_HTTP;
    }
}

export default Avalanche;
