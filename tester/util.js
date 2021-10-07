const ENTITY_KEYS = [
    "provider_name",
    "provider_contract",
    "nft_contract",
    "nft_id",
    "token",
    "token_symbol",
    "amount",
    "price",
    "price_usd",
    "seller",
    "buyer",
    "sold_at",
    "block_number",
    "transaction_hash",
    "protocol",
];

const PROVIDER_KEYS = ["getSymbol", "getPrice", "pathToAbi", "addToDatabase"];

module.exports = { ENTITY_KEYS, PROVIDER_KEYS };
