const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    entry: "./app.ts",
    mode: "development",
    devtool: "inline-source-map",

    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },

    devServer: {
        static: {
        directory: path.resolve(__dirname, "public")
        },
        port: 8080,
        open: true,
        hot: false
    },

    module: {
        rules: [
            {
                test: /\.(png|jpg|jpeg)$/i,
                type: "asset/resource",
            },
            {
                // Embed your WGSL files as strings
                test: /\.wgsl$/i,
                type: "asset/source",
            },
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [new HtmlWebpackPlugin({
        template: "./index.html",
    })],
};
