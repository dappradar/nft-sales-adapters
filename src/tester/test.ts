// In order to have your pull request approven this test case must not fail
// Sample usage: node tester/test.js ../adapters/ens/index.js
import * as dotenv from "dotenv";

dotenv.config();

import path from "path";

import { ENTITY_KEYS, PROVIDER_KEYS } from "./util";
import { AVAILABLE_PROTOCOLS } from "../sdk/constants";

import { ISaleEntity } from "../sdk/Interfaces";
import { dynamicImport } from "../sdk/util";

if (process.argv.length < 3) {
    console.error(`Missing correct pathname to test`);
    process.exit(1);
}

const pathToAdapter = path.resolve(__dirname, process.argv[2]);
const tester = async (): Promise<void> => {
    try {
        const AdapterClass = await dynamicImport(pathToAdapter);
        const adapter = new AdapterClass();
        for (const key of PROVIDER_KEYS) {
            if (!Object.keys(adapter).includes(key)) {
                throw new Error("Modules are expected to have value run");
            }
        }

        const entities: ISaleEntity[] = [];

        adapter.addToDatabase = async (entity: ISaleEntity) => {
            entities.push(entity);
            if (entities.length > 4) {
                await adapter.stop();
            }
        };

        await adapter.run();

        if (entities.length == 0) {
            throw new Error("No entities were returned");
        }

        for (const entity of entities) {
            for (const entityKey of ENTITY_KEYS) {
                if (!entity.hasOwnProperty(entityKey)) {
                    throw new Error(`Missing ${entityKey} property in entity`);
                }
            }

            if (!Object.values(AVAILABLE_PROTOCOLS).find(p => p === entity.protocol)) {
                throw new Error(`Unsupported protocol "${entity.protocol}"`);
            }
        }

        console.log(entities);
    } catch (err) {
        console.error(err);
        process.exit();
    }
};

const main = async () => {
    await tester()
        .then(() => {
            console.log("Tests were passed");
            process.exit();
        })
        .catch(err => console.log("Got an error in tester", err));
};
main();
