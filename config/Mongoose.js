module.exports = {
	core: {
		uri: 'mongodb://localhost:27017/test_core',
		options: {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		}
	}
};
