class Metadata {
    block = async (provider: any): Promise<number | string> => {
        if (provider.block !== 0 && !provider.block) {
            throw new Error("Testing block not supplied");
        }
        return provider.block;
    };

    // Ensure metadata methods exists.
    ensure = async (_provider: any) => {};

    get = async (_provider: any) => {};

    update = async (_provider: any, _block: number | string) => {};

    create = async (_provider: any, _block: number | string) => {};
}

export default new Metadata();
