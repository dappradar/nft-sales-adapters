import fs from "fs";

const PATH_TO_METADATA = `${__dirname}/../../data/metadata`;

class Metadata {
    constructor() {
        this.ensureDir();
    }

    private ensureDir = () => {
        fs.mkdirSync(PATH_TO_METADATA, {recursive: true});
    }

    private getPathToProviderFile = (provider: any): string => {
        return `${PATH_TO_METADATA}/${provider.name}.txt`
    }

    private get = async (provider: any): Promise<number | string> => {
        try {
            const buffer = await fs.promises.readFile(this.getPathToProviderFile(provider));

            const block = buffer.toString();

            if (!block) {
                await this.update(provider, provider.block);

                return provider.block;
            }

            return block;
        } catch (err) {
            await this.update(provider, provider.block);

            return provider.block;
        }
    };

    block = async (provider: any): Promise<number | string> => {
        if (provider.block !== 0 && !provider.block) {
            throw new Error("Testing block not supplied");
        }

        let block = await this.get(provider);

        if (Number(block) < provider.block) {
            block = provider.block;

            await this.update(provider, block);
        }

        return block;
    }

    update = async (provider: any, block: number | string): Promise<void> => {
        await fs.promises.writeFile(this.getPathToProviderFile(provider), String(block));
    };
}

export default new Metadata();
