const _ = require('lodash');
const Utility = require('../../Utility');

const Private = {
  Cors: {
    name: 'Cors',
    version: '1.0.0',
    async register(server, options) {
      server.ext('onPreResponse', (request, reply) => {
        const res = request.raw.res;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Expose-Headers', '*');

        _.forEach(options.headers, (v, k) => {
          res.setHeader(k, v);
        });
        return reply.continue;
      });
    }
  }
};

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      const hapi = global.core.projects[instanceName].hapi;
      const config = Utility.RequireWithCheckExist(`${projectDir}/config/Hapi.js`);
      await hapi.server.register({
        plugin: Private.Cors,
        options: _.get(config, 'plugins.cors.options', {})
      });
      return true;
    } catch (error) {
      throw error;
    }
  }
};
