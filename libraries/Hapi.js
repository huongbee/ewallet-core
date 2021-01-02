const Filehound = require('filehound');
const _ = require('lodash');
const Utility = require('./Utility');
const Hapi = require('@hapi/hapi');
const Route = require('./hapi/Route');
const Plugin = require('./hapi/Plugin');
const Path = require('path');
const Fs = require('fs');

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      global.core.projects[instanceName].hapi = global.core.projects[instanceName].hapi ? global.core.projects[instanceName].hapi : {
        server: null
      };
      const hapi = global.core.projects[instanceName].hapi;
      const config = Utility.RequireWithCheckExist(`${projectDir}/config/Hapi.js`);
      const isActiveHapi = _.get(config, 'isActive', false);
      if (isActiveHapi === false) {
        return false;
      }
      hapi.server = Hapi.server(config.server);
      await Route.Apply(instanceName, projectDir);
      await Plugin.Apply(instanceName, projectDir);
      console.log(`[${instanceName}] - Hapi Server running on ${hapi.server.info.uri}`);

      await hapi.server.start();
    } catch (error) {
      throw error;
    }
  }
};
