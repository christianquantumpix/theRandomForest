const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

const path = require("path");

module.exports = merge(common, {
    devtool: "source-map",
    mode: "production"
});
