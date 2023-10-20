import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Mooi extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.MOOI;
        this.chainId = 71;
        this.node = process.env.MOOI_NODE_HTTP;
    }
}

export default Mooi;
