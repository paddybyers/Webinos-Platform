var fs = require('fs');
var util = require('util');
var secstore = require("../Manager/Storage/src/main/javascript/securestore.js");
var sc = require('schema')('authEnvironment', { fallbacks: 'STRICT_FALLBACKS' });

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
					},
				},
				additionalProperties: false
			},
		},
	},

	true,
	true,

	function (res, callback){
		callback(null, res);
	}
)

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
					},
				},
				additionalProperties: false
			},
		},
	},

	true,
	true,

	function (res, callback){
		callback(null, res);
	}
)

if (typeof webinos === "undefined") {
	var webinos = {};
}
if (!webinos.authentication) {
	webinos.authentication = {};
}

webinos.rpc = require('./rpc.js');


var AuthStatus, AuthError, AuthSuccessCB, AuthErrorCB, WebinosAuthenticationInterface, WebinosAuthentication;

AuthStatus = function () {
};

AuthStatus.prototype.lastAuthTime = "";
AuthStatus.prototype.authMethod = "";
AuthStatus.prototype.authMethodDetails = "";


AuthError = function () {
	"use strict";
	this.code = Number;
};

AuthError.prototype.UNKNOWN_ERROR = 0;
AuthError.prototype.INVALID_ARGUMENT_ERROR = 1;
AuthError.prototype.PERMISSION_DENIED_ERROR = 20;
AuthError.prototype.TIMEOUT_ERROR = 2;


AuthSuccessCB = function () {
};

AuthSuccessCB.prototype.onSuccess = function () {
	return;
};


AuthErrorCB = function () {
};

AuthErrorCB.prototype.onError = function (error) {
	return;
};


WebinosAuthentication = function () {
	"use strict";
	this.authentication = new WebinosAuthenticationInterface();
};

WebinosAuthenticationInterface = function () {
};

webinos.authentication = new WebinosAuthenticationInterface();


var password_filename = "./authentication/password.txt", authstatus_filename = "./authentication/authstatus.txt";

var storePass = "PZpassword", storeFile = "./auth.zip", storeDir  = "./authentication";

var ask, getAuthTime, username;

webinos.authentication.authenticate = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var newly_authenticated, passfile, p, authfile, buffer = {}, error = {};

	if (params[0] !== '') {
		username = params[0];
		webinos.authentication.isAuthenticated(params, function (authenticated) {
			if (authenticated === false) {
				ask("Password", function (password) {
					newly_authenticated = false;
					secstore.open(storePass, storeFile, storeDir, function (err) {	
						if (err === undefined || err === null) {
							try {
								passfile = JSON.parse(fs.readFileSync(password_filename) + "");

								passfile_validation(passfile, function(e, result){
									if (e !== undefined && e !== null) {
										error.code = AuthError.prototype.UNKNOWN_ERROR;
										error.message = "Validation error in " + password_filename;
										errorCB(error);
									}
									else {
										for (p in passfile) {
											if (passfile[p].username === username && passfile[p].password === password) {
												buffer = {"username" : username, "lastAuthTime" : getAuthTime() , "authMethod" : "password", "authMethodDetails" : "console inserted password"}
												newly_authenticated = true;
												break;
											}
										}
									}
								});

								if (newly_authenticated === true) {
									authfile = JSON.parse(fs.readFileSync(authstatus_filename) + "");

									authfile_validation(authfile, function(e, result){
										if (e !== undefined && e !== null) {
											error.code = AuthError.prototype.UNKNOWN_ERROR;
											error.message = "Validation error in " + authstatus_filename;
											errorCB(error);
										}
										else {
											authfile.push(buffer);
											fs.writeFileSync(authstatus_filename, JSON.stringify(authfile), 'utf-8');

											secstore.close(storePass, storeFile, storeDir, function (err) {	
												if (err !== undefined && err !== null) {
													errorCB(err);
												}
												else {
													webinos.authentication.getAuthenticationStatus([username], function (authStatus) {
														successCB("User authenticated\n" + authStatus);
													},
													function (err) {
														errorCB(err);
													});
												}
											});
										}
									});

								}
								else {
									if (newly_authenticated === false) {
										secstore.close(storePass, storeFile, storeDir, function (err) {	
											if (err !== undefined && err !== null) {
												errorCB(err);
											}
											else {
												error.code = AuthError.prototype.UNKNOWN_ERROR;
												error.message = "Wrong username or password";
												errorCB(error);
											}
										});
									}
								}
							}
							catch (e) {
								errorCB(e);
							}
						} else {		
							errorCB(err);
						}
					});
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
	var now = new Date(), month, date, hours, minutes, offset, h_offset, m_offset;
	
	month = now.getMonth();
	month = month + 1;
	if (month < 10) {
		month = "0" + month;
	}
	
	date = now.getDate();
	if (date < 10) {
		date = "0" + date;
	}
	
	hours = now.getHours();
	if (hours < 10) {
		hours = "0" + hours;
	}
	
	minutes = now.getMinutes();
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	
	offset = now.getTimezoneOffset();
	h_offset = Math.floor(offset / 60);
	m_offset = offset - h_offset * 60;
	h_offset = h_offset * -1;
	if (h_offset > -10 && h_offset < 0) {
		h_offset = (h_offset + "").split('-')[1];
		h_offset = "-0" + h_offset;
	}
	else {
		if (h_offset > -1 && h_offset < 10) {
			h_offset = "+0" + h_offset;
		}
		else {
			if (h_offset > 9) {
				h_offset = "+" + h_offset;
			}
		}
	}
	if (m_offset < 10) {
		m_offset = "0" + m_offset;
	}

	return now.getFullYear() + "-" + month + "-" + date + "T" + hours + ":" + minutes + h_offset + ":" + m_offset;
};


ask = function (question, callback) {
	"use strict";
	var pswd = "", passwd,
	stdin = process.stdin, stdout = process.stdout,
	stdio = process.binding("stdio");

	stdio.setRawMode(true);
	stdin.resume();
	stdout.write(question + ": ");

	passwd = function (char, key) {
		if (key.name === 'enter') {
			stdout.write("\n");
			stdio.setRawMode(false);
			stdin.pause();
			callback(pswd);
			pswd = "";
		}
		else {
			if (key.name === 'backspace') {
				pswd = pswd.substring(0, pswd.length - 1);
			}
			else {
				if (key.ctrl && key.name === 'c') {
					stdio.setRawMode(false);
					process.exit();
				}
				else {
					pswd = pswd + key.name;
				}
			}
		}
	};
	
	if (stdin.listeners('keypress').length === 0) {
		stdin.on('keypress', passwd);
	}
};


webinos.authentication.isAuthenticated = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var authenticated, authfile, authrow, error = {};
	
	if (params[0] !== '') {
		username = params[0];
		authenticated = false;
		secstore.open(storePass, storeFile, storeDir, function (err) {	
			if (err === undefined || err === null) {
				try {
					authfile = JSON.parse(fs.readFileSync(authstatus_filename) + "");

					authfile_validation(authfile, function(e, result){
						if (e !== undefined && e !== null) {
							error.code = AuthError.prototype.UNKNOWN_ERROR;
							error.message = "Validation error in " + authstatus_filename;
							errorCB(error);
						}
						else {
							for (authrow in authfile) {
								if (authfile[authrow].username === username) {
									authenticated = true;
									break;
								}
							}
							secstore.close(storePass, storeFile, storeDir, function (err) {	
								if (err !== undefined && err !== null) {
									errorCB(err);
								}
								else {
									successCB(authenticated);
								}
							});
						}
					});
				}
				catch (e) {
					errorCB(e);
				}
			} else {		
				errorCB(err);
			}
		});
	}
	else {
		error.code = AuthError.prototype.INVALID_ARGUMENT_ERROR;
		error.message = "Username is missing";
		errorCB(error);
	}
};

webinos.authentication.getAuthenticationStatus = function (params, successCB, errorCB, objectRef) {
	"use strict";
	var authenticated, resp, authfile, authrow, auth_s = new AuthStatus(), error = {};
	
	if (params[0] !== '') {
		username = params[0];
		webinos.authentication.isAuthenticated(params, function (authenticated) {
			if (authenticated === true) {
				resp = "";
				secstore.open(storePass, storeFile, storeDir, function (err) {	
					if (err === undefined || err === null) {
						try {
							authfile = JSON.parse(fs.readFileSync(authstatus_filename) + "");

							authfile_validation(authfile, function(e, result){
								if (e !== undefined && e !== null) {
									error.code = AuthError.prototype.UNKNOWN_ERROR;
									error.message = "Validation error in " + authstatus_filename;
									errorCB(error);
								}
								else {
									for (authrow in authfile) {
										if (authfile[authrow].username === username) {
											auth_s.lastAuthTime = authfile[authrow].lastAuthTime;
											auth_s.authMethod = authfile[authrow].authMethod;
											auth_s.authMethodDetails = authfile[authrow].authMethodDetails;
											resp = "lastAuthTime: " + auth_s.lastAuthTime + "\nauthMethod: " + auth_s.authMethod + "\nauthmethodDetails: " + auth_s.authMethodDetails;
											break;
										}
									}
									secstore.close(storePass, storeFile, storeDir, function (err) {	
										if (err !== undefined && err !== null) {
											errorCB(err);
										}
										else {
											if (resp !== "") {
												successCB(resp);
											}
											else {
												error.code = AuthError.prototype.UNKNOWN_ERROR;
												error.message = "Authentication status not available";
												errorCB(error);
											}
										}
									});
								}
							});
						}
						catch (e) {
							errorCB(e);
						}
					} else {		
						errorCB(err);
					}
				});
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

var authenticationModule = new RPCWebinosService({
	api: 'http://webinos.org/api/authentication',
	displayName: 'Authentication',
	description: 'webinos authentication API'
});

authenticationModule.authenticate = webinos.authentication.authenticate;
authenticationModule.isAuthenticated = webinos.authentication.isAuthenticated;
authenticationModule.getAuthenticationStatus = webinos.authentication.getAuthenticationStatus;
webinos.rpc.registerObject(authenticationModule);
