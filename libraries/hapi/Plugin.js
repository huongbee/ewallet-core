const _ = require('lodash');
const Utility = require('../Utility');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');

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
        const config = Utility.RequireWithCheckExist(`${projectDir}/config/Hapi.js`);
        const swaggerOptions = _.get(config, 'plugins.swagger.options', {});
        await hapi.server.register([
          Inert,
          Vision,
          {
            plugin: HapiSwagger,
            options: swaggerOptions
          }
        ]);
        // const Swagger = require('./plugins/Swagger');
        // await Swagger.Apply(instanceName, projectDir);
      }
    } catch (error) {
      throw error;
    }
  }
};
