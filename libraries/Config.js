const Filehound = require('filehound');
const Path = require('path');
const _ = require('lodash');
const Utility = require('./Utility');

module.exports = {
  async Apply(projectDir) {
    try {
      let Env = null;
      try {
        Env = require('get-env')(require('../config/Env'));
      } catch (error) {
        Env = process.env.NODE_ENV;
      }
      Env = _.upperFirst(Env);
      const pathConfigList = await Filehound.create()
        .path(`${projectDir}/config`)
        .ext('.js')
        .depth(0)
        .find();
      const configEnv = Utility.RequireWithCheckExist(`${projectDir}/config/env/${Env}.js`);
      _.forEach(pathConfigList, (pathConfig) => {
        const sourceName = Path.basename(pathConfig).replace('.js', '');
        let source = Utility.RequireWithCheckExist(pathConfig);
        if (_.isUndefined(configEnv[sourceName]) === false) {
          source = _.merge(source, configEnv[sourceName]);
        }
        Utility.SetRequireCache(pathConfig, source);
      });
      return true;
    } catch (error) {
      throw error;
    }
  }
};
