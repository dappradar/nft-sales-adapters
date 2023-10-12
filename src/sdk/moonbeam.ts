import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC from "./EVMC";

class Moonbeam extends EVMC {
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
