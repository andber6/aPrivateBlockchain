const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');   // Will contain the transactions stored in the block, by default it will encode the data
		this.timeStamp = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                              // Reference to the previous Block Hash
    }
    
    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     */
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            // Save in auxiliary variable the current block hash
            const currentHash = self.hash;
            self.hash = null;

            const newHash = SHA256(JSON.stringify(self)).toString();
            self.hash = currentHash;
            resolve(currentHash === newHash);

        }).catch("Couldnt validate");
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     *  Steps:
     *  
     *  1. Use hex2ascii module to decode the data
     *  2. Because data is a javascript object use JSON.parse(string) to get the Javascript Object
     *  3. Resolve with the data and make sure that you don't need to return the data for the `genesis block` 
     *     or Reject with an error.
     */
    getBData() {
        let self = this;
        return new Promise((resolve, reject) => {
            let encodedData = self.body
            let decodedData = hex2ascii(encodedData);
		    obj = JSON.parse(decodedData);
		    if (self.height > 0) {
			    resolve(obj);
            }
        }).catch("Something went wrong");
    }

}

module.exports.Block = Block;                    // Exposing the Block class as a module