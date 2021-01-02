const _ = require('lodash');
const Utility = require('../../Utility');

const Private = {
	ApiReply: {
		name: 'apiReply',
		version: '1.0.0',
		async register(server, options) {
			const api = function (data) {
				if (_.isObject(data)) {
					data.isApiReply = true;
				}
				return this.response(data);
			};
			server.decorate('toolkit', 'api', api);
			server.ext('onPostHandler', (request, reply) => {
				const response = request.response;
				if (_.get(response, 'source.isApiReply', null) !== null) {
					delete response.source.isApiReply;
					request.isApiReply = true;
				}
				return reply.continue;
			});
			server.ext('onPreResponse', (request, reply) => {
				const response = request.response;
				if (_.get(request, 'isApiReply', false) === true || response instanceof Error) {
					if (response instanceof Error) {
						const outputStatusCode = _.get(response, 'output.statusCode', null);
						if (outputStatusCode !== null) {
							switch (outputStatusCode) {
								case 401:
									return reply.response({
										code: 401,
										data: {
											message: _.includes(['Missing authentication', ''], response.message) ? _.get(options, 'message.401', 'Thông tin xác thực không hợp lệ') : response.message
										}
									}).code(200);
								case 404:
									return reply.response({
										code: 404,
										data: {
											message: _.get(options, 'message.404', 'Find not found')
										}
									}).code(200);
								case 403:
									return reply.response({
										code: 403,
										data: {
											message: _.get(options, 'message.403', 'Forbidden')
										}
									}).code(200);
								case 400:
									if (response.name === 'ValidationError' && response.isBoom === true) {
										return reply.response({
											code: 400,
											data: {
												message: _.get(response, 'output.payload.message', 'Invalid request input')
											}
										}).code(200);
									}
									return reply.response({
										code: 400,
										data: {
											message: _.get(options, 'message.400', 'Invalid request input')
										}
									}).code(200);

								default: {
									if (response.name === 'ValidationError') {
										return reply.response({
											code: 500,
											data: {
												message: response.message
											}
										}).code(200);
									}
									const handleExcetion = options.handleException(response, request, reply);
									if (!_.isFunction(handleExcetion) || !_.isObject(handleExcetion)) {
										return reply.response({
											code: 500,
											data: {
												message: _.get(options, 'message.500', 'Dịch vụ đang gặp gián đoạn. Vui lòng quay lại sau')
											}
										}).code(200);
									}
									return handleExcetion;
								}
							}
						}
					}
					if (response.statusCode !== 200 && response.statusCode !== 302) {
						return reply.response({
							code: response.statusCode,
							data: response.source
						}).code(200);
					}
					return response;
				}
				return response;
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
				plugin: Private.ApiReply,
				options: _.get(config, 'plugins.apiReply.options', {})
			});
			return true;
		} catch (error) {
			throw error;
		}
	}
};
