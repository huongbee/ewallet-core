const _ = require('lodash');
const Path = require('path');
const Config = require('./libraries/Config');
const Mongoose = require('./libraries/Mongoose');
const Autoload = require('./libraries/Autoload');
const Task = require('./libraries/Task');
const Hapi = require('./libraries/Hapi');

global.core = global.core ? global.core : {};
global.core.projects = global.core.projects ? global.core.projects : {};

const project = global.core.projects;

const Private = {
	FilterInstance(instance) {
		return {
			isReady: instance.isReady,
			models: _.get(instance, 'mongoose.models', {}),
			hapi: _.get(instance, 'hapi', {})
		};
	}
};

class System {
	constructor(instanceName, projectDir) {
		this.instanceName = _.toUpper(instanceName);
		this.projectDir = Path.resolve(projectDir);
		global.core.projects[this.instanceName] = global.core.projects[instanceName] ? global.core.projects[instanceName] : {
			isReady: false
		};
	}

	async Start(callback) {
		try {
			await Config.Apply(this.projectDir);
			await Mongoose.Apply(this.instanceName, this.projectDir);
			await Autoload.Apply(this.instanceName, this.projectDir);
			await Task.Apply(this.instanceName, this.projectDir);
			await Hapi.Apply(this.instanceName, this.projectDir);

			if (_.isFunction(callback)) {
				callback();
			}
			project[this.instanceName].isReady = true;
			const result = Private.FilterInstance(project[this.instanceName]);
			return result;
		} catch (error) {
			console.log(error.message, '\n\n', error.stack);
			process.exit(1);
		}
	}
}

module.exports = System;

module.exports.getInstance = (instanceName) => {
	instanceName = _.toUpper(instanceName);
	if (_.get(global, `core.projects['${instanceName}']`, false) === false) {
		throw new Error('Instance not found');
	}
	return Private.FilterInstance(global.core.projects[instanceName]);
};

module.exports.Mongoose = {
	Schema: Mongoose.Schema
};


module.exports.Joi = require('@hapi/joi');
