import * as ethers from 'ethers';

const targetHash = "0xa1e5c93171dc8706775d2b92cb0241ca0ec9c9abd376a0585c8d7ae8a7bd4b4f";

const abi =[
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "listingId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "paymentToken",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "collection",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ListingBoughtFull",
        "type": "event"
    }
]

const finalSignatures = [
    `${abi[0].name}(${abi[0].inputs.map(i => i.type).join(',')})`
];

finalSignatures.forEach(sig => {
    const hash = ethers.utils.id(sig);
    console.log(hash);
    if (hash === targetHash) {
        console.log('Found matching signature:', sig);
        console.log('Hash:', hash);
    }
});