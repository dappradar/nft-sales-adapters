import _ from "lodash";
import { asyncTimeout } from "./util";
import { DEFAULT_MAX_RETRIES } from "./constants";

export interface IBasicSDKRetryConfig {
    maxRetries?: number;
    customParams?: object;
    callback: () => any;
    successCallback?: (response: any) => void;
    errorCallback?: (response: any) => void;
    retryAfter?: number;
    action?: string;
}

export interface IBasicSDKCaller {
    fileName?: string;
    method?: string;
}

export interface IBasicSDKError {
    fileName?: string;
    method?: string;
    providerName: string;
    state: string;
    retries: number;
    duration?: number;

    [key: string]: any;
}

abstract class BasicSDK {
    provider: any;
    stack?: any;
    running: boolean;

    protected constructor(provider: any) {
        this.provider = provider;
        this.running = true;
    }

    getCaller = (): IBasicSDKCaller => {
        const oldStackTrace = Error.prepareStackTrace;

        try {
            Error.prepareStackTrace = (err, structuredStackTrace) => structuredStackTrace;
            Error.captureStackTrace(this);
            const stack = this.stack[2];

            return {
                fileName: stack.getFileName(),
                method: stack.getFunctionName(),
            };
        } finally {
            Error.prepareStackTrace = oldStackTrace;
        }

        return {};
    };

    retry = async (config: IBasicSDKRetryConfig): Promise<any> => {
        const caller: IBasicSDKCaller = await this.getCaller();

        let startDate: number = Date.now();
        let retries = 0;
        let error: IBasicSDKError | undefined;
        while (retries < (config.maxRetries || DEFAULT_MAX_RETRIES)) {
            startDate = Date.now();
            const logData = {
                ...caller,
                providerName: this.provider.name,
                contract: this.provider.contract,
                ...config.customParams,
                action: config.action,
                retries,
            };
            const commonLogData = _.omitBy(logData, _.isNil);

            try {
                console.info({
                    ...commonLogData,
                    state: "start",
                });

                const response: any = await config.callback();

                console.info({
                    ...commonLogData,
                    state: "end",
                    duration: Date.now() - startDate,
                });

                if (config.successCallback) {
                    await config.successCallback(response);
                }

                return response;
            } catch (err) {
                // @ts-ignore
                error = {
                    ...commonLogData,
                    ...caller,
                    error: err?.message,
                    state: "error",
                    duration: Date.now() - startDate,
                };

                console.info(error);
                await asyncTimeout(config.retryAfter);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout(3);
        process.exit();
    };
}

export default BasicSDK;
