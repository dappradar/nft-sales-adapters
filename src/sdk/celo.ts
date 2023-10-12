import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC from "./EVMC";

class Celo extends EVMC {
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
