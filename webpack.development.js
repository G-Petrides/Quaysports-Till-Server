const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        "main":'./typescript/till-server.ts',
    },
    devtool: 'inline-source-map',
    mode: 'development',
    watchOptions: {
        poll: true,
        ignored: /node_modules/
    },
    plugins: [
        new NodemonPlugin(),
        new Dotenv(),
    ],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.crt$/i,
                use: 'raw-loader',
            },
            {
                test: /\.ucc$/i,
                use: 'raw-loader',
            },
        ],
    },
    externals: [
        {'sharp': 'commonjs sharp',},
        { 'express': 'commonjs express' },
        {'mongodb': 'commonjs mongodb',},
        'mongodb-client-encryption',
        'aws4',
        'aws-crt',
        'saslprep',
        'kerberos',
        'snappy',
        'bson-ext',
        '@mongodb-js/zstd',
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '',
    },
    target: 'node',
};