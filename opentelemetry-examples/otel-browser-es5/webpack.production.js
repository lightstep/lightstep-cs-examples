const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const UnusedFilesWebpackPlugin = require('unused-files-webpack-plugin').UnusedFilesWebpackPlugin;

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    usedExports: true,
    // mangleWasmImports: true,
    // mergeDuplicateChunks: true,
    minimizer: [new TerserPlugin({
      extractComments: false,
      terserOptions: {
        // ie8: true,
        // safari10: true,
        sourceMap: false,
      },
    })],
  },
  plugins: [
    new BundleAnalyzerPlugin(),
    // new UnusedFilesWebpackPlugin({}),
  ],
});