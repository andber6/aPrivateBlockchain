const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            // this.height = this.chain.length;
            resolve(this.height);
        });
    }
    /*
     * _addBlock(block) will store a block in the chain
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array.
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let chainHeight = await self.getChainHeight();
            if (chainHeight > -1) {
                const prevBlock = await self.getBlockByHeight(self.height);
                block.previousBlockHash = prevBlock.hash;
            }
            block.timeStamp = new Date().getTime().toString().slice(0, -3);
            const newHeight = self.height +1;
            block.height = newHeight;
            block.hash = SHA256(JSON.stringify(block)).toString();
            let isValid = await self.validateChain();
            if(isValid) {
                self.chain.push(block);
                self.height++;
            }
            resolve(block);
            
        }).catch("Something went wrong");
    }
    /*
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     */
     _getCurrentTimeStamp() {
        return new Date().getTime().toString().slice(0,-3);
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
//      <WALLET_ADDRESS>:${new Date().getTime().toString().slice(0,-3)}:starRegistry;
        resolve(`${address}:${this._getCurrentTimeStamp()}:starRegistry`)
            
        });
    }
    /*
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let msgTime = parseInt(message.split(':')[1]);
            let currTime = parseInt(new Date().getTime().toString().slice(0, -3));
            // Check if time elapsed is less than 5 minutes
            if (currTime - msgTime <= 300) {
                // Verify msg is valid using 'bitcoinjs-message' library
                const msgValid = bitcoinMessage.verify(message, address, signature);
                if (msgValid) {
                    // Create a new block
                    let newBlock = new BlockClass.Block({"star":star,"owner":address});
                    // Add the new block to the chain
                    resolve(await self._addBlock(newBlock));
                }
            }
        }).catch("Couldnt submit star");
    }
    /*
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if(block){
                resolve(block);
            }
        }).catch("something went wrong");
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            }
        }).catch("Something went wrong");
    }
    /*
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach(async(block) => {
                let data = await block.getBData();
                if (data.owner === address) {
                    stars.push(data);
                } else {
                    reject();
                }
            });
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            this.chain.forEach(async(block) => {
                // Check if its Genesis Block
                // console.log(block);
                if (block.height === 0) {
                    // Check if genesis block is valid
                    let isValid = await block.validate();
                    if (!isValid){
                        errorLog.push("Genesis Block is not valid");
                    }
                // Check current block's previousBlockHash matches to make sure link isn't broken
                } else if (block.previousBlockHash === self.chain[block.height-1].hash) {
                    // Check if current block is valid
                    let isValid = await block.validate();
                    if (!isValid){
                        errorLog.push(block + "is not validated");
                    }
                }
            });
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;   