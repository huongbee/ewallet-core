const Filehound = require('filehound');
const _ = require('lodash');
const ImportFresh = require('import-fresh');
const Utility = require('./Utility');
const Mongoose = require('mongoose');
const AsyncForEach = require('await-async-foreach');
const Fs = require('fs');

const Private = {
  async ConnectToMongo(uri, options) {
    return new Promise((resolve, reject) => {
      const connection = Mongoose.createConnection(uri, options);

      connection.on('error', (err) => {
        reject(err);
      });

      connection.on('open', () => {
        resolve(connection);
      });
    });
  }
};
module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      global.core.projects[instanceName].mongoose = global.core.projects[instanceName].mongoose ? global.core.projects[instanceName].mongoose : {
        connections: {},
        models: {},
        autoIncrement: {}
      };

      const connections = global.core.projects[instanceName].mongoose.connections;
      const models = global.core.projects[instanceName].mongoose.models;
      const autoIncrement = global.core.projects[instanceName].mongoose.autoIncrement;
      const config = Utility.RequireWithCheckExist(`${projectDir}/config/Mongoose.js`);
      const error = [];
      await AsyncForEach(config, async (v, k) => {
        try {
          connections[k] = await Private.ConnectToMongo(v.uri, v.options);
          autoIncrement[k] = ImportFresh('mongoose-auto-increment');
          autoIncrement[k].initialize(connections[k]);
        } catch (e) {
          error.push(`[${k}] - ${e.message}`);
        }
      }, 'parallel', 20);
      if (error.length > 0) {
        throw new Error(`[${instanceName}] - Mongoose error: \n${error.join('\n')}`);
      }
      if (!Fs.existsSync(`${projectDir}/models`)) {
        Fs.mkdirSync(`${projectDir}/models`);
      }
      const pathModelList = await Filehound.create()
        .path(`${projectDir}/models`)
        .ext('.js')
        .glob('*Model.js')
        .find();
      AsyncForEach(pathModelList, (pathModel) => {
        const model = Utility.RequireWithCheckExist(pathModel);
        const connection = connections[model.connection];
        if (_.isUndefined(connection) === false) {
          model.attributes.options.collection = model.tableName;
          model.attributes.options.versionKey = false;
          if (model.autoIncrement) {
            _.forEach(model.autoIncrement, (v, k) => {
              v.model = `${model.tableName}-${k}`;
              v.field = k;
              model.attributes.plugin(autoIncrement[model.connection].plugin, v);
            });
          }
          models[model.tableName] = connection.model(model.tableName, model.attributes);
          Utility.SetRequireCache(pathModel, models[model.tableName]);
        } else {
          error.push(`${instanceName} - Connection ${model.connection} is invalid at ${pathModel}`);
        }
      }, 'parallel', 20);
      if (error.length > 0) {
        throw new Error(`[${instanceName}] - Mongoose error: \n${error.join('\n')}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
};

module.exports.Schema = Mongoose.Schema;
