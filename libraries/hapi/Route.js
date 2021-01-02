const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');
const Utility = require('../Utility');
const AsyncForEach = require('await-async-foreach');

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      const hapi = global.core.projects[instanceName].hapi;
      if (Fs.existsSync(`${projectDir}/hapi/routes`)) {
        const pathRouteList = await Filehound.create()
          .path(`${projectDir}/hapi/routes`)
          .ext('.js')
          .glob('*Route.js')
          .find();
        AsyncForEach(pathRouteList, (pathRoute) => {
          const route = Utility.RequireWithCheckExist(pathRoute);
          hapi.server.route(route);
        }, 'parallel', 20);
      }
      if (Fs.existsSync(`${projectDir}/hapi/api`)) {
        const pathRouteList = await Filehound.create()
          .path(`${projectDir}/hapi/api`)
          .ext('.js')
          .glob('*Route.js')
          .find();
        // const pathRouteList = require(`${projectDir}/private/route.js`);
        // Fs.writeFileSync(`${projectDir}/private/route.js`,JSON.stringify(pathRouteList));
        AsyncForEach(pathRouteList, (pathRoute) => {
          const route = Utility.RequireWithCheckExist(pathRoute);
          hapi.server.route(route);
        }, 'parallel', 20);
      }
    } catch (error) {
      throw error;
    }
  }
};
