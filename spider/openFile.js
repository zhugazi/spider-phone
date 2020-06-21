const path = require('path')
const fs = require('fs')

const readFile = require("util").promisify(fs.readFile);

async function modelInit(filePath) {
  try {
      const fr = await readFile(filePath,"utf-8");
      return fr;
   } catch (err) {
      console.log('Error', err);
   }    
}

module.exports = {
  modelInit
}