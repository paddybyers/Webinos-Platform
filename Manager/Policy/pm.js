
var pmlib;
var res;
var pm;

function runPolicyTest() {
	try {
		console.log("Loading policy module...");
		pmlib = require('./build/default/pm.node');
		
		try {
			pm = new pmlib.PolicyManagerInt();
			console.log("Load success...");
		}
		catch(e) {
			console.log("Load error: "+e.message);
			return;
		}

		console.log("Calling enforceRequest with no args...");
		try {
			res = pm.enforceRequest();
			console.log("Unexpected success...");
		}
		catch(e) {
			console.log("Expected error: "+e.message+"...");
		}
		
		console.log("Calling enforceRequest with bad args...");
		try {
			res = pm.enforceRequest(1);
			console.log("Unexpected success...");
		}
		catch(e) {
			console.log("Expected error: "+e.message+"...");
		}
		
		console.log("Testing some features...");
		
		res = pm.enforceRequest("web.contact");
		console.log("web.contact: "+ruleEffectDescription(res));

		res = pm.enforceRequest("web.calendar");
		console.log("web.calendar: "+ruleEffectDescription(res));

		res = pm.enforceRequest("web.contact.write");
		console.log("web.contact.write: "+ruleEffectDescription(res));

		res = pm.enforceRequest("web.camera");
		console.log("web.camera: "+ruleEffectDescription(res));

		res = pm.enforceRequest("web.calendar.write");
		console.log("web.calendar.write: "+ruleEffectDescription(res));

		res = pm.enforceRequest("web.discovery");
		console.log("web.discovery: "+ruleEffectDescription(res));

	}
	catch(e) {
		console.log("error: "+e.message);
	}
}

function ruleEffectDescription(num) {
	if(num == 0)
		return "PERMIT";
	if(num == 1)
		return "DENY";
	if(num == 2)
		return "PROMPT_ONESHOT";
	if(num == 3)
		return "PROMPT_SESSION";
	if(num == 4)
		return "PROMPT_BLANKET";
	if(num == 5)
		return "UNDETERMINED";
	return "INAPPLICABLE";
}

runPolicyTest();
