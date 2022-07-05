import * as dotenv from "dotenv";
dotenv.config();

const asyncTimeout = async (seconds = 10): Promise<void> => {
    return new Promise(r => setTimeout(r, 1000 * seconds));
};

const dynamicImport = async (pathToFile: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        import(pathToFile)
            .then(file => {
                resolve(file.default);
            })
            .catch(error => {
                reject(error);
            });
    });
};

export { asyncTimeout, dynamicImport };
