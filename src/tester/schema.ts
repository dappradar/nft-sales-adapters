import * as yup from "yup";
import BigNumber from "bignumber.js";
import moment from "moment";

export const schema = yup.object().shape({
    providerName: yup
        .string()
        .trim()
        .min(3)
        .max(255)
        .required(),
    providerContract: yup
        .string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .when("addressCaseSensitive", {
            is: false,
            then: schema => schema.lowercase().strict(),
        }),
    chainId: yup.number().required(),
    nfts: yup
        .array()
        .of(
            yup
                .object()
                .shape({
                    contract: yup
                        .string()
                        .trim()
                        .min(3)
                        .required()
                        .when("addressCaseSensitive", {
                            is: false,
                            then: value => value.lowercase().strict(),
                        }),
                    id: yup
                        .string()
                        .trim()
                        .min(1)
                        .required(),
                    amount: yup
                        .number()
                        .min(1)
                        .required(),
                })
                .required(),
        )
        .min(1)
        .required(),
    token: yup
        .string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .when("addressCaseSensitive", {
            is: false,
            then: schema => schema.lowercase().strict(),
        }),
    price: yup
        .mixed()
        .required()
        .test("is-bignumber", `"price" field is not of type BigNumber`, value => value instanceof BigNumber),
    seller: yup
        .string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .when("addressCaseSensitive", {
            is: false,
            then: schema => schema.lowercase().strict(),
        }),
    buyer: yup
        .string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .when("addressCaseSensitive", {
            is: false,
            then: schema => schema.lowercase().strict(),
        }),
    soldAt: yup
        .mixed()
        .required()
        .test("is-moment", `"soldAt" field is not of type Moment`, value => value instanceof moment),
    blockNumber: yup.number().required(),
    transactionHash: yup
        .string()
        .trim()
        .required(),
});
