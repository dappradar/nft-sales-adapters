class Metadata {
    block = async provider => {
        if (!provider.block) {
            throw new Error("Testing block not supplied");
        }
        return provider.block;
    };

    // Ensure metadata methods exists.
    ensure = async _provider => {};

    get = async _provider => {};

    update = async (_provider, _block) => {};

    create = async (_provider, _block) => {};
}

module.exports = new Metadata();
