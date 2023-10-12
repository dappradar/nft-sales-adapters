import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC from "./EVMC";

class Matic extends EVMC {
    constructor(props: any) {
        super(props);

        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.POLYGON;
        this.chainId = 16;
        this.node = process.env.MATIC_NODE_HTTP;
    }
}

export default Matic;
