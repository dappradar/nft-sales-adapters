import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC_HTTP from "./EVMC-HTTP";

class Moonriver extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        this.protocol = AVAILABLE_PROTOCOLS.MOONRIVER;
        this.chainId = 38;
        this.node = process.env.MOONRIVER_NODE_HTTP;
    }
}

export default Moonriver;
