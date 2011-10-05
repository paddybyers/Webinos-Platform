var fs = require('fs');
var util = require('util');
var secstore = require("./old_securestore.js");

if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

var AuthStatus = function () {
};

AuthStatus.lastAuthTime = "";
AuthStatus.authMethod = "";
AuthStatus.authMethodDetails = "";

var WebinosAuthenticationInterface = function () {
};

password_filename = "./authentication/password.txt";
authstatus_filename = "./authentication/authstatus.txt";
sep = '|';


var storePass = "PZpassword"; 
var storeFile = "./auth.zip";
var storeDir  = "./authentication";


WebinosAuthenticationInterface.authenticate = function(params, successCB, errorCB, objectRef) {

	if (params[0] !== '') {
		username = params[0];
		WebinosAuthenticationInterface.isAuthenticated(params, function(authenticated) {
			if (authenticated === false) {
				ask("Password", function(password) {
					try {
						newly_authenticated = false;
						secstore.open(storePass, storeFile, storeDir, function(err) {	
							if (err === undefined || err === null) {
								stats = fs.statSync(password_filename);
								passfile = fs.readFileSync(password_filename)+"";
								passrows = passfile.split('\n');
								for (p in passrows) {
									if (passrows[p] !== '') {
										if (typeof(passrows[p]) == 'string' && username == passrows[p].split(sep)[0] && password == passrows[p].split(sep)[1]) {
											var buffer = username+"|"+getAuthTime()+"|"+"password"+"|"+"console inserted password\n";
											newly_authenticated = true;
											write_buffer(buffer, function(){
												secstore.close(storePass, storeFile, storeDir, function(err) {	
													if (err !== undefined && err !== null) {
														console.log(err);
													}
													successCB("User authenticated");
												});
											});
											break;
										}
									}
								}
								if (newly_authenticated === false) {
									secstore.close(storePass, storeFile, storeDir, function(err) {	
										if (err !== undefined && err !== null) {
											console.log(err);
										}
										successCB("Wrong username or password");
									});
								}

							} else {		
								console.log(err);
							}
						});

					}
					catch (e) {
						errorCB(e+"");
					}
				});
			}
			else {
				successCB("User already authenticated");
			}
		}, function(error){
			errorCB(error);
		});
	}
	else {
		errorCB("Username is missing");
	}
};

function getAuthTime (){
	var now = new Date();
	month = now.getMonth();
	month = month + 1;
	if (month < 10) {
		month = "0"+month;
	}
	date = now.getDate();
	if (date < 10) {
		date = "0"+date;
	}
	hours = now.getHours();
	if (hours < 10) {
		hours = "0"+hours;
	}
	minutes = now.getMinutes();
	if (minutes < 10) {
		minutes = "0"+minutes;
	}
	offset = now.getTimezoneOffset();
	h_offset = Math.floor(offset/60);
	m_offset = offset - h_offset * 60;
	h_offset = h_offset * -1;
	if (h_offset > -10 && h_offset < 0) {
		h_offset = (h_offset+"").split('-')[1];
		h_offset = "-0"+h_offset;
	}
	else {
		if (h_offset > -1 && h_offset < 10) {
			h_offset = "+0"+h_offset;
		}
		else {
			if (h_offset > 9) {
				h_offset = "+"+h_offset;
			}
		}
	}
	if (m_offset < 10) {
		m_offset = "0"+m_offset;
	}

	return now.getFullYear()+"-"+month+"-"+date+"T"+hours+":"+minutes+h_offset+":"+m_offset;
}

function write_buffer (buffer,done) {
	fs.open(authstatus_filename, 'a', 0666, function(e, fd) {
		fs.write(fd, buffer, undefined, 'utf-8', function() {
			fs.close(fd);
			done();
		});
	});
}

function ask(question, callback) {
	var stdin = process.stdin, stdout = process.stdout;
	var stdio = process.binding("stdio");

	stdio.setRawMode(true);
	stdin.resume();
	stdout.write(question + ": ");

	var pswd = "";
	passwd = function(char, key) {
		if (key.name == 'enter') {
				stdout.write("\n");
				stdio.setRawMode(false);
				stdin.pause();
				callback(pswd);
				pswd="";
		}
		else {
			if (key.name == 'backspace') {
				pswd = pswd.substring(0,pswd.length-1);
			}
			else {
				if (key.ctrl && key.name == 'c') {
					stdio.setRawMode(false);
					process.exit();
				}
				else {
					pswd = pswd+key.name;
				}
			}
		}
	};
	
	if (stdin.listeners('keypress').length === 0) {
		stdin.on('keypress', passwd);
	}
}


WebinosAuthenticationInterface.isAuthenticated = function(params, successCB, errorCB, objectRef) {

	if (params[0] !== '') {
		username = params[0];
		try {
			authenticated = false;
			secstore.open(storePass, storeFile, storeDir, function(err) {	
				if (err === undefined || err === null) {
					stats = fs.statSync(authstatus_filename);
					authfile = fs.readFileSync(authstatus_filename)+"";
					authrows = authfile.split('\n');
					for (authrow in authrows) {
						if (authrows[authrow] !== '' && typeof(authrows[authrow]) === 'string' && username == authrows[authrow].split(sep)[0]) {
							authenticated=true;
							break;
						}
					}
					secstore.close(storePass, storeFile, storeDir, function(err) {	
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

WebinosAuthenticationInterface.getAuthenticationStatus = function(params, successCB, errorCB, objectRef) {

	var auth_s = new AuthStatus();
	if (params[0] !== '') {
		username = params[0];
		WebinosAuthenticationInterface.isAuthenticated(params, function(authenticated) {
			if (authenticated === true) {
				try {
					resp = "Authentication status not available";
					secstore.open(storePass, storeFile, storeDir, function(err) {	
						if (err === undefined || err === null) {
							stats = fs.statSync(authstatus_filename);
							authfile = fs.readFileSync(authstatus_filename)+"";
							authrows = authfile.split('\n');
							for (authrow in authrows) {
								if (authrows[authrow] !== '' && typeof(authrows[authrow]) == 'string' && username == authrows[authrow].split(sep)[0]) {
									auth_s.lastAuthTime = authrows[authrow].split(sep)[1];
									auth_s.authMethod = authrows[authrow].split(sep)[2];
									auth_s.authMethodDetails = authrows[authrow].split(sep)[3];
									resp = "lastAuthTime: "+auth_s.lastAuthTime+"\nauthMethod: "+auth_s.authMethod+"\nauthmethodDetails: "+auth_s.authMethodDetails;
									break;
								}
							}
							secstore.close(storePass, storeFile, storeDir, function(err) {	
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
					successCB(e+"");
				}
			}
			else {
				successCB("User not authenticated");
			}
		}, function(error){
			errorCB(error);
		});
	}
	else {
		successCB("Username is missing");
	}
};

authenticationAPIsModule = {};
authenticationAPIsModule.authenticate = WebinosAuthenticationInterface.authenticate;
authenticationAPIsModule.isAuthenticated = WebinosAuthenticationInterface.isAuthenticated;
authenticationAPIsModule.getAuthenticationStatus = WebinosAuthenticationInterface.getAuthenticationStatus;
webinos.rpc.registerObject("AuthenticationAPIs", authenticationAPIsModule);
