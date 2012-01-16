var schema = exports;

schema.checkSchema = function(message) {
	var myEnv, assert, schema, validation;
	try {
		myEnv = require('schema')('myEnvironment', {locale: 'en'});
	} catch (err) {
		return 'failed';
	}
	try {
		assert = require('assert');
	} catch (err1) {
		return 'failed';
	}
	try {
		message = JSON.parse(message);
	} catch(err2) {
		return 'failed';
	}	
	
	schema = myEnv.Schema.create({
		type: 'object',
		properties:{
			register: {
				type:'boolean',
				default: false
			},
			
			type: {
				type: 'string',
				enum: ['JSONRPC', 'prop'],
				minLength: 0,
				maxLength: 7,
				default: 'JSONRPC'
			},
			from: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			to: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			resp_to: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			timestamp: {
				type: 'string',
				minLength: 0,
				maxLength: 200,
				default: '',
			},
			timeout: {
				type: 'string',
				minLength: 0,
				maxLength: 200,
				default: '',
			},
			payload: {
				type: 'object',
				default:[]
			}			
		},
		additionalProperties: false
	});
	try {
		validation = schema.validate(message);
		assert.strictEqual(validation.isError(), false);
		return validation.isError();
	} catch (err2) {
		console.log(validation.getError());
		return true;
	}
};



