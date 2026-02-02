const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Enable persistent caching
      webpackConfig.cache = {
        type: 'filesystem',
        cacheDirectory: require('path').resolve(__dirname, 'node_modules/.cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
      };

      // Optimize chunk splitting
      if (webpackConfig.optimization) {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                // Get the name of the package
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match) {
                  return 'vendor';
                }
                const packageName = match[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        };
      }

      // Minimize TerserPlugin work in development
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.optimization.minimize = false;
      }

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      // Speed up development builds
      process.env.NODE_ENV === 'development' && 'react-refresh/babel',
    ].filter(Boolean),
  },
};
