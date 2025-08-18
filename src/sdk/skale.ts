import * as dotenv from "dotenv";

dotenv.config();

import EVMC_HTTP from "./EVMC-HTTP";

class Skale extends EVMC_HTTP {
    constructor(props: any) {
        super(props);

        // SKALE "green-giddy-denebola" chain id (hex 0x585eb4b1)
        this.chainId = 1482601649;
        // Prefer env, fallback to provided public endpoint
        this.node = process.env.SKALE_NODE_HTTP || "https://mainnet.skalenodes.com/v1/green-giddy-denebola";
    }
}

export default Skale;


