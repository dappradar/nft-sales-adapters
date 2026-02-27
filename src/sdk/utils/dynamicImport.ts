export default async (pathToFile: string): Promise<any> => {
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
