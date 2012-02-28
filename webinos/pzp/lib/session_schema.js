/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2011 POLITO
*******************************************************************************/


var schema = exports;

// MODIFIED BY POLITO

// exported function to validate packages
schema.checkSchema = function(msg) {

	// 'type' field validation
	var validation = checkTypeSchema(msg);

	if(validation === false) { // validation error is false, so validation is ok
		if (msg.type === 'prop') {
			// 'prop' type message validation
			return checkPropSchema(msg);
		}
		if (msg.type === 'JSONRPC') {
			// 'JSONRPC' type message validation
			return checkJSONRPCSchema(msg);
		}
	}
	else {
		// 'type' field validation failed
		return validation;
	}
};

// function to validate 'prop' type packages
checkPropSchema = function(message) {
	var myEnv, assert, schema, validation;
	try {
		myEnv = require('schema')('myEnvironment', { fallbacks: 'STRICT_FALLBACKS' });
	} catch (err) {
		return 'failed';
	}
	try {
		assert = require('assert');
	} catch (err1) {
		return 'failed';
	}
	
	// 'prop' type package schema
	// required fields: 'type', 'from', 'to' and 'payload' 
	schema = myEnv.Schema.create({
		type: 'object',
		properties:{
			type: {
				type: 'string',
				enum: ['prop']
			},
			from: {
				type: ['string','null'],
				minLength: 0,
				maxLength: 99,
				default: ''
			},
			to: {
				type: ['string','null'],
				minLength: 0,
				maxLength: 99,
				default: ''
			},
			payload: {
				type: 'object',
				default:[]
			}			
		},
		// no other fields allowed
		additionalProperties: false
	});
	try {
		validation = schema.validate(message);
		assert.strictEqual(validation.isError(), false);
		return validation.isError();
	} catch (err2) {
		console.log(validation.getError());
		console.log(validation.getError().errors);
		return true;
	}
};

// function to validate 'JSONRPC' type packages
checkJSONRPCSchema = function(message) {
	var myEnv, assert, schema, validation;
	try {
		myEnv = require('schema')('myEnvironment', { fallbacks: 'STRICT_FALLBACKS' });
	} catch (err) {
		return 'failed';
	}
	try {
		assert = require('assert');
	} catch (err1) {
		return 'failed';
	}
	
	// 'JSONRPC' package schema
	// required fields: 'type', 'from', 'to' and 'payload' 
	// optiona fields: 'register', 'id', 'resp_to'
	schema = myEnv.Schema.create({
		type: 'object',
		properties:{
			register: {
				type:'boolean',
				optional : true
			},
			id: {
				type: 'number',
				optional : true
			},
			type: {
				type: 'string',
				enum: ['JSONRPC']
			},
			from: {
				type: ['string','null'],
				minLength: 0,
				maxLength: 99
			},
			to: {
				type: ['string','null'],
				minLength: 0,
				maxLength: 99
			},
			resp_to: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				optional : true
			},
			payload: {
				type: ['object', 'null'],
				default:[]
			}			
		},
		// no other fields allowed
		additionalProperties: false
	});
	try {
		validation = schema.validate(message);
		assert.strictEqual(validation.isError(), false);
		return validation.isError();
	} catch (err2) {
		console.log(validation.getError());
		console.log(validation.getError().errors);
		return true;
	}
};

// function to validate type field
checkTypeSchema = function(message) {
	var myEnv, assert, schema, validation;
	try {
		myEnv = require('schema')('myEnvironment', { fallbacks: 'STRICT_FALLBACKS' });
	} catch (err) {
		return 'failed';
	}
	try {
		assert = require('assert');
	} catch (err1) {
		return 'failed';
	}
	
	// only 'prop' and 'JSONRPC' types are allowed
	schema = myEnv.Schema.create({
		type: 'object',
		properties:{
			type: {
				type: 'string',
				enum: ['JSONRPC', 'prop']
			}			
		},
		// other fields allowed (in this function we test only 'type' field)
		additionalProperties: true
	});
	try {
		validation = schema.validate(message);
		assert.strictEqual(validation.isError(), false);
		return validation.isError();
	} catch (err2) {
		console.log(validation.getError());
		console.log(validation.getError().errors);
		return true;
	}
};
