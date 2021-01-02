const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');
const Utility = require('../Utility');

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      const hapi = global.core.projects[instanceName].hapi;
      const config = Utility.RequireWithCheckExist(`${projectDir}/config/Hapi.js`);
      hapi.server.ext('onRequest', (request, reply) => {
        request.getPayloadDecrypt = (r) => {
          return r.payload;
        };
        return reply.continue;
      });

      const isActiveCors = _.get(config, 'plugins.cors.isActive', false);
      if (isActiveCors === true) {
        const Cors = require('./plugins/Cors');
        await Cors.Apply(instanceName, projectDir);
      }

      const isActiveJwt = _.get(config, 'plugins.jwt.isActive', false);
      if (isActiveJwt === true) {
        const Jwt = require('./plugins/Jwt');
        await Jwt.Apply(instanceName, projectDir);
      }
      const isActiveApiReply = _.get(config, 'plugins.apiReply.isActive', false);
      if (isActiveApiReply === true) {
        const ApiReply = require('./plugins/ApiReply');
        await ApiReply.Apply(instanceName, projectDir);
      }
      const isActiveSwagger = _.get(config, 'plugins.swagger.isActive', false);
      if (isActiveSwagger === true) {
        const Swagger = require('./plugins/Swagger');
        await Swagger.Apply(instanceName, projectDir);
      }
    } catch (error) {
      throw error;
    }
  }
};
