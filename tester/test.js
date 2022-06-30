// In order to have your pull request approven this test case must not fail
// Sample usage: node tester/test.js ../adapters/ens/index.js
require("dotenv").config();
const path = require("path");
const { ENTITY_KEYS, PROVIDER_KEYS } = require("./util");
const { AVAILABLE_PROTOCOLS } = require("../sdk/util");

if (process.argv.length < 3) {
    console.error(`Missing correct pathname to test`);
    process.exit(1);
}

const importedAdapter = path.resolve(__dirname, process.argv[2]);
const tester = async () => {
    const AdapterClass = require(importedAdapter);
    const adapter = new AdapterClass();
    for (const key of PROVIDER_KEYS) {
        if (!Object.keys(adapter).includes(key)) {
            throw new Error("Modules are expected to have value run");
        }
    }

    const array = [];

    adapter.addToDatabase = async entity => {
        array.push(entity);
        if (array.length > 4) {
            await adapter.stop();
        }
    };
    await adapter.run();

    for (const entity of array) {
        // Should have all needed properties
        if (Object.keys(entity).length !== ENTITY_KEYS.length) {
            throw new Error("Missing properties in entity, they should be: " + ENTITY_KEYS);
        }
        ENTITY_KEYS.forEach(key => {
            const value = entity[key];

            if (!value) {
                throw new Error("Missing entity key: " + key);
            }
            if (key === "amount" || key === "price" || key === "price_usd" || key === "block_number") {
                if (typeof value !== "number") {
                    throw new Error("Bad type for key " + key);
                }
            } else {
                if (typeof value !== "string") {
                    throw new Error("Bad type for key " + key);
                }
                if (key === "protocol" && ![...Object.values(AVAILABLE_PROTOCOLS), "matic"].includes(value)) {
                    console.log(value, Object.values(AVAILABLE_PROTOCOLS));
                    throw new Error("Unsuported protocol provided");
                }
            }
        });
    }
    console.log("Test passed");
    process.exit(0);
};

const main = async () => {
    await tester().catch(err => console.log("Got an error in tester", err));
};
main();
