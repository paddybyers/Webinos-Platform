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
* Copyright 2012 Torsec -Computer and network security group-
* Politecnico di Torino
******************************************************************************/

(function() {

var fs = require('fs');
var sc = require('schema')('authEnvironment', { fallbacks: 'STRICT_FALLBACKS' });
var tty = require('tty'); // required starting from node.js 0.6

var localDependencies = require("../dependencies.json");
var root = "../" + localDependencies.root.location;
var dependencies = require(root + "/dependencies.json");

if (typeof webinos === "undefined") {
	var webinos = {};
}

// commented out due to lack of zipper module in node.js 0.6
// var secstore = require("../Manager/Storage/src/main/javascript/securestore.js");

var passfile_validation = sc.f(
	{
		type: 'array', // function arguments are treated as array
		items: {
			// password.txt schema
			type: 'array',
			items: {
				type: 'object',
				properties: {
					username: {
						type:'string'
					},
					password: {
						type:'string'
					}
				},
				additionalProperties: false
			}
		}
	},

	true,
	true,

	function (res, callback){
		"use strict";
		callback(null, res);
	}
);

var authfile_validation = sc.f(
	{
		type: 'array', // function arguments are treated as array
		items: {
			// authstatus.txt schema
			type: 'array',
			items: {
				type: 'object',
				properties: {
					username: {
						type:'string'
					},
					lastAuthTime: {
						type:'string'
					},
					authMethod: {
						type:'string'
					},
					authMethodDetails: {
						type:'string'
					}
				},
				additionalProperties: false
			}
		}
	},

	true,
	true,

	function (res, callback){
		"use strict";
		callback(null, res);
	}
);



var AuthStatus, AuthError, AuthSuccessCB, AuthErrorCB;

AuthStatus = function () {
	"use strict";
};

AuthStatus.prototype.lastAuthTime = String;
AuthStatus.prototype.authMethod = String;
AuthStatus.prototype.authMethodDetails = String;


AuthError = function () {
	"use strict";
	this.code = Number;
};

AuthError.prototype.UNKNOWN_ERROR = 0;
AuthError.prototype.INVALID_ARGUMENT_ERROR = 1;
AuthError.prototype.PERMISSION_DENIED_ERROR = 20;
AuthError.prototype.TIMEOUT_ERROR = 2;


AuthSuccessCB = function () {
	"use strict";
};

AuthSuccessCB.prototype.onSuccess = function () {
	"use strict";
	return;
};


AuthErrorCB = function () {
	"use strict";
};

AuthErrorCB.prototype.onError = function (error) {
	"use strict";
	return;
};


var password_filename = "./client/authentication/password.txt", authstatus_filename = "./client/authentication/authstatus.txt";

// commented out due to lack of zipper module in node.js 0.6
//var storePass = "PZpassword", storeFile = "./auth.zip", storeDir  = "./authentication";

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var AuthenticationModule = function(rpcHandler) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api: 'http://webinos.org/api/authentication',
		displayName: 'Authentication',
		description: 'webinos authentication API'
	});
};

AuthenticationModule.prototype = new RPCWebinosService;

var ask, getAuthTime, username;

AuthenticationModule.prototype.authenticate = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var newly_authenticated, passfile, p, authfile, buffer = {}, error = {};
	var that = this;

	if (params[0] !== '') {
		username = params[0];
		this.isAuthenticated(params, function (authenticated) {
			if (authenticated === false) {
				ask("Password", function (err, password) {
					if (err === null || err === undefined) {
						newly_authenticated = false;
					
						// commented out due to lack of zipper module in node.js 0.6
						//secstore.open(storePass, storeFile, storeDir, function (err) {	
						//	if (err === undefined || err === null) {
								try {
									passfile = JSON.parse(fs.readFileSync(password_filename).toString());

									passfile_validation(passfile, function(e, result){
										if (e !== undefined && e !== null) {
											error.code = AuthError.prototype.UNKNOWN_ERROR;
											error.message = "Validation error in " + password_filename;
											errorCB(error);
										}
										else {
											for (p = 0; p < passfile.length; p = p + 1) {
												if (passfile[p].username === username && passfile[p].password === password) {
													buffer = {
														username : username,
														lastAuthTime : getAuthTime(), 
														authMethod : "password".toString(),
														authMethodDetails : "console inserted password".toString()
													};
													newly_authenticated = true;
													break;
												}
											}
										}
									});

									if (newly_authenticated === true) {
										authfile = JSON.parse(fs.readFileSync(authstatus_filename).toString());

										authfile_validation(authfile, function(e, result){
											if (e !== undefined && e !== null) {
												error.code = AuthError.prototype.UNKNOWN_ERROR;
												error.message = "Validation error in " + authstatus_filename;
												errorCB(error);
											}
											else {
												authfile.push(buffer);
												fs.writeFileSync(authstatus_filename, JSON.stringify(authfile), 'utf-8');

												// commented out due to lack of zipper module in node.js 0.6
												//secstore.close(storePass, storeFile, storeDir, function (err) {	
												//	if (err !== undefined && err !== null) {
												//		errorCB(err);
												//	}
												//	else {
														that.getAuthenticationStatus([username], function (authStatus) {
															successCB("User authenticated\n" + authStatus);
														},
														function (err) {
															errorCB(err);
														});
												//	}
												//});
											}
										});

									}
									else {
										if (newly_authenticated === false) {

											// commented out due to lack of zipper module in node.js 0.6
											//secstore.close(storePass, storeFile, storeDir, function (err) {	
											//	if (err !== undefined && err !== null) {
											//		errorCB(err);
											//	}
											//	else {
													error.code = AuthError.prototype.UNKNOWN_ERROR;
													error.message = "Wrong username or password";
													errorCB(error);
											//	}
											//});
										}
									}
								}
								catch (e) {
									errorCB(e);
								}
						//	} else {		
						//		errorCB(err);
						//	}
						//});
					}
					else {
						errorCB(err);
					}
				});
			}
			else {
				error.code = AuthError.prototype.UNKNOWN_ERROR;
				error.message = "User already authenticated";
				errorCB(error);
			}
		}, function (err) {
			errorCB(err);
		});
	}
	else {
		error.code = AuthError.prototype.INVALID_ARGUMENT_ERROR;
		error.message = "Username is missing";
		errorCB(error);
	}
};

getAuthTime = function () {
	"use strict";
	var now = new Date(), tmp, h_tmp, m_tmp;
	var month, date, hours, minutes, h_offset, m_offset;
	
	tmp = now.getMonth();
	tmp = tmp + 1;
	if (tmp < 10) {
		month = "0" + tmp.toString();
	}
	else {
		month = tmp.toString();
	}
	
	tmp = now.getDate();
	if (tmp < 10) {
		date = "0" + tmp.toString();
	}
	else {
		date = tmp.toString();
	}
	
	tmp = now.getHours();
	if (tmp < 10) {
		hours = "0" + tmp.toString();
	}
	else {
		hours = tmp.toString();
	}
	
	tmp = now.getMinutes();
	if (tmp < 10) {
		minutes = "0" + tmp.toString();
	}
	else {
		minutes = tmp.toString();
	}
	
	tmp = now.getTimezoneOffset();
	h_tmp = Math.floor(tmp / 60);
	m_tmp = tmp - h_tmp * 60;
	h_tmp = h_tmp * -1;
	if (h_tmp > -10 && h_tmp < 0) {
		h_offset = (h_tmp.toString()).split('-')[1];
		h_offset = "-0" + h_offset;
	}
	else {
		if (h_tmp > -1 && h_tmp < 10) {
			h_offset = "+0" + h_tmp.toString();
		}
		else {
			if (h_tmp > 9) {
				h_offset = "+" + h_tmp.toString();
			}
		}
	}
	if (m_tmp < 10) {
		m_offset = "0" + m_tmp.toString();
	}

	return now.getFullYear().toString() + "-" + month + "-" + date + "T" + hours + ":" + minutes + h_offset + ":" + m_offset;
};


ask = function (question, callback) {
	"use strict";
	var pswd = "", passwd, error= {}, invalid_char,
	stdin = process.stdin, stdout = process.stdout;

	stdin.resume();
	tty.setRawMode(true); // modified to comply with node.js 0.6
	invalid_char = false;
	stdout.write(question + ": ");

	passwd = function (char, key) {

		if (key !== undefined) { // key parameter is undefined when the acquired character is a number
			if (key.ctrl && key.name === 'c') {
				tty.setRawMode(false); // modified to comply with node.js 0.6
				process.exit();
			}
			switch (key.name) {
				case "enter":
					stdout.write("\n");
					tty.setRawMode(false); // modified to comply with node.js 0.6
					stdin.pause();
					if (invalid_char === true) {
						error.code = AuthError.prototype.UNKNOWN_ERROR;
						// we don't use an error message like "invalid character" to avoid information leakage
						error.message = "Wrong username or password";
						callback(error, pswd);
					}
					else {
						callback(null, pswd);
					}
					pswd = "";
					break;
				case "backspace":
					pswd = pswd.substring(0, pswd.length - 1);
					break;
				// invalid characters
				case "space":
				case "tab":
					invalid_char = true;
					break;
				default:
					pswd = pswd + char;
			}
		}
		else {
			if (char !== undefined ) { // when the acquired character is a number, only char parameter is defined
					pswd = pswd + char;
			}
		}
	};
	
	// modified to work around a presumed RPC problem
	//if (stdin.listeners('keypress').length === 0) {
	//	stdin.on('keypress', passwd);
	//}
	if (stdin.listeners('keypress').length > 0) {
		stdin.listeners('keypress').pop();
	}
	stdin.on('keypress', passwd);
};


AuthenticationModule.prototype.isAuthenticated = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var authenticated, authfile, authrow, error = {};
	
	if (params[0] !== '') {
		username = params[0];
		authenticated = false;
		
		// commented out due to lack of zipper module in node.js 0.6
		//secstore.open(storePass, storeFile, storeDir, function (err) {	
		//	if (err === undefined || err === null) {
				try {
					authfile = JSON.parse(fs.readFileSync(authstatus_filename).toString());

					authfile_validation(authfile, function(e, result){
						if (e !== undefined && e !== null) {
							error.code = AuthError.prototype.UNKNOWN_ERROR;
							error.message = "Validation error in " + authstatus_filename;
							errorCB(error);
						}
						else {
							for (authrow = 0; authrow < authfile.length; authrow = authrow + 1) {
								if (authfile[authrow].username === username) {
									authenticated = true;
									break;
								}
							}

							// commented out due to lack of zipper module in node.js 0.6
							//secstore.close(storePass, storeFile, storeDir, function (err) {	
							//	if (err !== undefined && err !== null) {
							//		errorCB(err);
							//	}
							//	else {
									successCB(authenticated);
							//	}
							//});
						}
					});
				}
				catch (e) {
					errorCB(e);
				}
		//	} else {		
		//		errorCB(err);
		//	}
		//});
	}
	else {
		error.code = AuthError.prototype.INVALID_ARGUMENT_ERROR;
		error.message = "Username is missing";
		errorCB(error);
	}
};

AuthenticationModule.prototype.getAuthenticationStatus = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var authenticated, resp, authfile, authrow, auth_s = new AuthStatus(), error = {};
	
	if (params[0] !== '') {
		username = params[0];
		this.isAuthenticated(params, function (authenticated) {
			if (authenticated === true) {
				resp = "";

				// commented out due to lack of zipper module in node.js 0.6
				//secstore.open(storePass, storeFile, storeDir, function (err) {	
				//	if (err === undefined || err === null) {
						try {
							authfile = JSON.parse(fs.readFileSync(authstatus_filename).toString());

							authfile_validation(authfile, function(e, result){
								if (e !== undefined && e !== null) {
									error.code = AuthError.prototype.UNKNOWN_ERROR;
									error.message = "Validation error in " + authstatus_filename;
									errorCB(error);
								}
								else {
									for (authrow = 0; authrow < authfile.length; authrow = authrow + 1) {
										if (authfile[authrow].username === username) {
											auth_s.lastAuthTime = authfile[authrow].lastAuthTime;
											auth_s.authMethod = authfile[authrow].authMethod;
											auth_s.authMethodDetails = authfile[authrow].authMethodDetails;
											resp = "lastAuthTime: " + auth_s.lastAuthTime.toString() + "\nauthMethod: " + auth_s.authMethod.toString() + "\nauthmethodDetails: " + auth_s.authMethodDetails.toString();
											break;
										}
									}

									// commented out due to lack of module file in node.js 0.6
									//secstore.close(storePass, storeFile, storeDir, function (err) {	
									//	if (err !== undefined && err !== null) {
									//		errorCB(err);
									//	}
									//	else {
											if (resp !== "") {
												successCB(resp);
											}
											else {
												error.code = AuthError.prototype.UNKNOWN_ERROR;
												error.message = "Authentication status not available";
												errorCB(error);
											}
									//	}
									//});
								}
							});
						}
						catch (e) {
							errorCB(e);
						}
				//	} else {		
				//		errorCB(err);
				//	}
				//});
			}
			else {
				error.code = AuthError.prototype.UNKNOWN_ERROR;
				error.message = "User not authenticated";
				errorCB(error);
			}
		}, function (err) {
			errorCB(err);
		});
	}
	else {
		error.code = AuthError.prototype.INVALID_ARGUMENT_ERROR;
		error.message = "Username is missing";
		errorCB(error);
	}
};

exports.Service = AuthenticationModule;

})();
