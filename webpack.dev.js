const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

const merge = require('webpack-merge');
const path = require('path');
const sane = require('sane');
const webpack = require('webpack');

const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const dashboard = new Dashboard();

const pkg = require('./package.json');
const common = require('./webpack.common.js');
const settings = require('./webpack.settings.js');

const configureDevServer = () => ({
  public: settings.devServerConfig.public(),
  host: settings.devServerConfig.host(),
  port: settings.devServerConfig.port(),
  https: !!parseInt(settings.devServerConfig.https()),
  quiet: true,
  hot: true,
  hotOnly: true,
  overlay: true,
  compress: true,
  contentBase: path.resolve(__dirname, settings.paths.build.base),
  watchContentBase: true,
  publicPath: '/js/',
  stats: 'errors-only',
  watchOptions: {
    ignored: /node_modules/,
    poll: settings.devServerConfig.poll(),
  },
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
  // Use sane to monitor all of the templates files and sub-directories
  before: (app, server) => {
    const watcher = sane(path.join(__dirname, settings.paths.public), {
      glob: ['**/*'],
      poll: !!parseInt(settings.devServerConfig.poll()),
    });
    watcher.on('change', function(filePath, root, stat) {
      console.log('  File modified:', filePath);
      server.sockWrite(server.sockets, 'content-changed');
    });
  },
});

const configureImageLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]',
          },
        },
      ],
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]',
          },
        },
      ],
    };
  }
};

const configurePostcssLoader = buildType => {
  // Don't generate CSS for the legacy config in development
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(p?css)$/,
      loader: 'ignore-loader',
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(p?css)$/,
      use: [
        {
          loader: 'style-loader',
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            sourceMap: true,
          },
        },
        {
          loader: 'resolve-url-loader',
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    };
  }
};

const configureOptimization = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      namedModules: true,
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      namedModules: true,
    };
  }
};

module.exports = [
  merge(common.legacyConfig, {
    output: {
      filename: '[name]-legacy.[hash].js',
      publicPath: settings.devServerConfig.public() + '/',
    },
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    optimization: configureOptimization(LEGACY_CONFIG),
    devServer: configureDevServer(LEGACY_CONFIG),
    module: {
      rules: [configurePostcssLoader(LEGACY_CONFIG), configureImageLoader(LEGACY_CONFIG)],
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
  }),
  merge(common.modernConfig, {
    output: {
      filename: '[name].[hash].js',
      publicPath: settings.devServerConfig.public() + '/',
    },
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    optimization: configureOptimization(MODERN_CONFIG),
    devServer: configureDevServer(MODERN_CONFIG),
    module: {
      rules: [configurePostcssLoader(MODERN_CONFIG), configureImageLoader(MODERN_CONFIG)],
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new DashboardPlugin(dashboard.setData)],
  }),
];
