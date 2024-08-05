const serverless = require("serverless-http");

const app = require("../apps/server/dist/index.js");

module.exports.handler = serverless(app);
