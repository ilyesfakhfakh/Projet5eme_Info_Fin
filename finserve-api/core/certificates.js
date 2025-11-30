const path = require("path");
const fs = require("fs");

const certificateFile = fs.readFileSync(path.join(__dirname, "api.on-bazaar.dev.pem"));
const certificateFileKey = fs.readFileSync(path.join(__dirname, "api.on-bazaar.dev-key.pem"));

module.exports = {
  certificateFile: certificateFile,
  certificateFileKey: certificateFileKey,
};
