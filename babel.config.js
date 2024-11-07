module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        moduleName: "@env",
        path: ".env",
        blacklist: null,
        whitelist: null,
        safe: true,
        allowUndefined: false
      }],
      ["@babel/plugin-transform-flow-strip-types"],
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
      ["@babel/plugin-proposal-class-properties", { "loose": true }],
      ["module-resolver", {
        "alias": {
          "@": "./",
          "@config": "./src/config",
          "@components": "./src/components",
          "@context": "./src/context",
          "@constants": "./constants",
          "@assets": "./assets",
          "@auth": "./src/auth",
          "@public": "./src/public",
          "@services": "./src/services",
          "@app": "./src/app",
          "@utils": "./src/utils",
          "@env": "./.env"
        },
        "extensions": [
          ".js",
          ".jsx",
        ]
      }],
      'react-native-reanimated/plugin',
    ]
  };
};
