const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');
const Utility = require('./Utility');
const AsyncForEach = require('await-async-foreach');

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      const log4js = global.core.projects[instanceName].log4js;
      if (!Fs.existsSync(`${projectDir}/autoload`)) {
        Fs.mkdirSync(`${projectDir}/autoload`);
      }
      const pathAutoloadList = await Filehound.create()
        .path(`${projectDir}/autoload`)
        .ext('.js')
        .glob('*Autoload.js')
        .find();
      AsyncForEach(pathAutoloadList, (pathAutoload) => {
        const autoloadName = Path.basename(pathAutoload).replace('Autoload.js', '');
        const autoload = Utility.RequireWithCheckExist(pathAutoload);
        if (_.get(autoload, 'isActive', false) === false) {
          return true;
        }
        const onLoad = _.get(autoload, 'onLoad', () => {
          console.warn(`[${instanceName}] - Not found function onLoad at Autoload ${autoloadName}`);
        });

        onLoad();
      }, 'parallel', 10);
      return true;
    } catch (error) {
      throw error;
    }
  }
};
