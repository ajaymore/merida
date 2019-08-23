const withCSS = require('@zeit/next-css');

module.exports = withCSS({
  webpack: config => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: 'empty'
    };

    return config;
  },
  distDir: process.env.NODE_ENV === 'production' ? './dist/.next' : './.next'
});
