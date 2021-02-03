const path = require("path");
// Simple config to output a minified JS file
module.exports = {
  mode: "development",
  entry: "./src/tracing.js",
  output: {
    filename: "tracing.js",
    path: path.resolve(__dirname, "dist"),
  },
};
