import * as dotenv from "dotenv";

dotenv.config();

import { AVAILABLE_PROTOCOLS } from "./constants";
import EVMC from "./EVMC";

class Moonriver extends EVMC {
    constructor(props: any) {
        super(props);
        this.range = 500;
        this.chunkSize = 2;
        this.protocol = AVAILABLE_PROTOCOLS.MOONRIVER;
        this.chainId = 38;
        this.node = process.env.MOONRIVER_NODE_HTTP;
    }
}

export default Moonriver;
