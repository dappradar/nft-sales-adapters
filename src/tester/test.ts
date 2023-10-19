// @ts-nocheck
// In order to have your pull request approved this test case must not fail
// Sample usage: node tester/test.js ../adapters/ens/index.js

import { PROVIDER_KEYS } from "./util";
import { ISaleEntity, ISaleEntityTest } from "../sdk/Interfaces";
import { getPaymentData, getChainData, dynamicImport } from "../sdk/utils";
import moment from "moment";
import { schema } from "./schema";
import { ValidationError } from "yup";
import {ADAPTERS} from "../config/adapters";
import {IBasicProviderOptions} from "../sdk/basic-provider";

interface IValidationError {
    reason: "InvalidQuery";
    message: string;
    value?: string;
    availableValues?: string[] | number[];
    field?: string;
}

if (process.argv.length < 3) {
    console.error(`Missing correct pathname to test`);
    process.exit(1);
}

const providerName = process.argv[2];

const entities: unknown[] = [];

const buildErrors = (rawErrors: ValidationError): IValidationError[] => {
    const errors: IValidationError[] = [];

    for (const rawError of rawErrors.inner) {
        if (rawError.type === "typeError") {
            if (rawError.params?.type === "array") {
                rawError.message = "Provided value is not an array";
            }

            if (rawError.params?.type === "number") {
                rawError.message = "Provided value is not a number";
            }
        }

        if (rawError.type === "oneOf") {
            rawError.message = "Provided value is not supported";
        }

        const { availableValues, resolved: values } = rawError.params || {};
        const error: IValidationError = {
            reason: "InvalidQuery",
            message: `Validation failure: ${rawError.message}`,
            availableValues: (availableValues || values) as any,
            field: rawError.path,
        };

        const value = rawError.params?.originalValue || rawError.value;

        if (value && value.length) {
            error.value = value;
        }

        errors.push(error);
    }

    return errors;
};

const addToDatabase = async (adapter: any, entity: ISaleEntity & ISaleEntityTest) => {
    if (!entity.chainId) {
        throw new Error("Chain ID is not defined");
    }

    const chainData = await getChainData(entity.chainId);

    entity.addressCaseSensitive = chainData.addressCaseSensitive;

    if (Array.isArray(entity.nfts)) {
        for (const i in entity.nfts) {
            entity.nfts[i].addressCaseSensitive = chainData.addressCaseSensitive;
        }
    }

    try {
        await schema.validate(entity, { abortEarly: false });
    } catch (err) {
        console.log(entity);
        console.error(buildErrors(err));
        process.exit(1);
    }

    const { paymentTokenSymbol, priceInUsd, priceInCrypto } = await getPaymentData(
        entity.chainId,
        entity.token,
        String(entity.price),
        moment(entity.soldAt),
    );

    entities.push({
        ...entity,
        tokenSymbol: paymentTokenSymbol,
        price: priceInCrypto,
        priceUsd: priceInUsd,
    });

    if (entities.length >= 5) {
        await adapter.stop();
        console.log(entities);
        process.exit()
    }
};

const tester = async (): Promise<void> => {
    try {
        const adapterConfig: IBasicProviderOptions | undefined = ADAPTERS.find(adapter => adapter.name === providerName);

        if (!adapterConfig) {
            throw new Error(`Adapter "${providerName}" does not exist`);
        }

        const AdapterClass = await dynamicImport(`${__dirname}/../adapters/${adapterConfig.basicProvider}/index.ts`);
        const adapter = new AdapterClass(adapterConfig);

        for (const key of PROVIDER_KEYS) {
            if (!Object.keys(adapter).includes(key)) {
                throw new Error("Modules are expected to have value run");
            }
        }

        adapter.addToDatabase = (entity: ISaleEntity & ISaleEntityTest) => addToDatabase(adapter, entity);

        await adapter.run();

        if (!entities.length) {
            throw new Error("No entities were returned");
        }

        console.log(entities);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

(async () => {
    await tester();

    console.log("Tests were passed");
    process.exit();
})();
