const path = require('path');

module.exports = {
    entry: {
        "main":'./typescript/till-server.ts',
    },
    mode: 'production',
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