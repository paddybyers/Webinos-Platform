var fs = require('fs');
var util = require('util');
var secstore = require("../Manager/Storage/src/main/javascript/securestore.js");

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
	this.authentication = new WebinosAuthenticationInterface();
};

WebinosAuthenticationInterface = function () {
};

webinos.authentication = new WebinosAuthenticationInterface();


var password_filename = "./authentication/password.txt", authstatus_filename = "./authentication/authstatus.txt", sep = '|';

var storePass = "PZpassword", storeFile = "./auth.zip", storeDir  = "./authentication";

var ask, getAuthTime, write_buffer, username;

webinos.authentication.authenticate = function (params, successCB, errorCB, objectRef) {
	var newly_authenticated, stats, passfile, passrows, p, buffer;

	if (params[0] !== '') {
		username = params[0];
		webinos.authentication.isAuthenticated(params, function (authenticated) {
			if (authenticated === false) {
				ask("Password", function (password) {
					try {
						newly_authenticated = false;
						secstore.open(storePass, storeFile, storeDir, function (err) {	
							if (err === undefined || err === null) {
								stats = fs.statSync(password_filename);
								passfile = fs.readFileSync(password_filename) + "";
								passrows = passfile.split('\n');
								for (p in passrows) {
									if (passrows[p] !== '') {
										if (typeof(passrows[p]) === 'string' && username === passrows[p].split(sep)[0] && password === passrows[p].split(sep)[1]) {
											buffer = username + "|" + getAuthTime() + "|" + "password" + "|" + "console inserted password\n";
											newly_authenticated = true;
											break;
										}
									}
								}
								if (newly_authenticated === true) {
									write_buffer(buffer, function () {
										secstore.close(storePass, storeFile, storeDir, function (err) {	
											if (err !== undefined && err !== null) {
												console.log(err);
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
									});
								}
								else {
									if (newly_authenticated === false) {
										secstore.close(storePass, storeFile, storeDir, function (err) {	
											if (err !== undefined && err !== null) {
												console.log(err);
											}
											successCB("Wrong username or password");
										});
									}
								}
							} else {		
								console.log(err);
							}
						});

					}
					catch (e) {
						errorCB(e + "");
					}
				});
			}
			else {
				successCB("User already authenticated");
			}
		}, function (error) {
			errorCB(error);
		});
	}
	else {
		errorCB("Username is missing");
	}
};

getAuthTime = function () {
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

write_buffer = function (buffer, done) {
	fs.open(authstatus_filename, 'a', 0666, function (e, fd) {
		fs.write(fd, buffer, undefined, 'utf-8', function () {
			fs.close(fd);
			done();
		});
	});
};

ask = function (question, callback) {
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
	var authenticated, stats, authfile, authrows, authrow;
	
	if (params[0] !== '') {
		username = params[0];
		try {
			authenticated = false;
			secstore.open(storePass, storeFile, storeDir, function (err) {	
				if (err === undefined || err === null) {
					stats = fs.statSync(authstatus_filename);
					authfile = fs.readFileSync(authstatus_filename) + "";
					authrows = authfile.split('\n');
					for (authrow in authrows) {
						if (authrows[authrow] !== '' && typeof(authrows[authrow]) === 'string' && username === authrows[authrow].split(sep)[0]) {
							authenticated = true;
							break;
						}
					}
					secstore.close(storePass, storeFile, storeDir, function (err) {	
						if (err !== undefined && err !== null) {
							console.log(err);
						}
						successCB(authenticated);
					});
				} else {		
					console.log(err);
				}
			});
		}
		catch (e) {
			successCB(false);
		}
	}
	else {
		errorCB("Username is missing");
	}
};

webinos.authentication.getAuthenticationStatus = function (params, successCB, errorCB, objectRef) {
	var authenticated, resp, stats, authfile, authrows, authrow, auth_s = new AuthStatus();
	
	if (params[0] !== '') {
		username = params[0];
		webinos.authentication.isAuthenticated(params, function (authenticated) {
			if (authenticated === true) {
				try {
					resp = "Authentication status not available";
					secstore.open(storePass, storeFile, storeDir, function (err) {	
						if (err === undefined || err === null) {
							stats = fs.statSync(authstatus_filename);
							authfile = fs.readFileSync(authstatus_filename) + "";
							authrows = authfile.split('\n');
							for (authrow in authrows) {
								if (authrows[authrow] !== '' && typeof(authrows[authrow]) === 'string' && username === authrows[authrow].split(sep)[0]) {
									auth_s.lastAuthTime = authrows[authrow].split(sep)[1];
									auth_s.authMethod = authrows[authrow].split(sep)[2];
									auth_s.authMethodDetails = authrows[authrow].split(sep)[3];
									resp = "lastAuthTime: " + auth_s.lastAuthTime + "\nauthMethod: " + auth_s.authMethod + "\nauthmethodDetails: " + auth_s.authMethodDetails;
									break;
								}
							}
							secstore.close(storePass, storeFile, storeDir, function (err) {	
								if (err !== undefined && err !== null) {
									console.log(err);
								}
								successCB(resp);
							});
						} else {		
							console.log(err);
						}
					});
				}
				catch (e) {
					successCB(e + "");
				}
			}
			else {
				successCB("User not authenticated");
			}
		}, function (error) {
			errorCB(error);
		});
	}
	else {
		successCB("username is missing");
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
