const _ = require('lodash');
const Fs = require('fs');

module.exports = {
  RequireWithCheckExist: (path) => {
    if (Fs.existsSync(path)) {
      return require(path.replace('.js', ''));
    }
    return false;
  },
  SetRequireCache: (filename, data) => {
    if (_.isUndefined(require.cache[filename].exports) === false) {
      require.cache[filename].exports = data;
      return true;
    }
    return false;
  }
};
