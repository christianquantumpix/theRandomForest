const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

const path = require("path");

module.exports = merge(common, {
    devtool: "eval-source-map",
    devServer: {
        host: "0.0.0.0",
        port: 5500, // port that we're using for local host (localhost: 5500) 8080 (default) broke everything
        static: path.resolve(__dirname, "dist"), // tells webpack to serve from the dist folder
        hot: true,
        devMiddleware: {
            publicPath: "/",
        }
    },
    mode: "development",
});
