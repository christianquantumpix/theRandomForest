const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "src/index.ts"),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                include: [path.resolve(__dirname, "src")]
            }
        ]
    },
    resolve: {
        extensions: [".js", ".ts"]
    },
    output: {
        publicPath: "dist",
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist")
    }
}
