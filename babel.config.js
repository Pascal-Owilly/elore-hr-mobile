module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
          alias: {
            '@': './',
            '@components': './components',
            '@lib': './lib',
            '@constants': './constants',
            '@types': './types',
            '@store': './store',
            '@assets': './assets'
          }
        }
      ]
    ]
  };
};