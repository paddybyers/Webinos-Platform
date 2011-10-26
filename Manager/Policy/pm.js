
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
		
		testFeatures("xxx");
		testFeatures("yyy");
		testFeatures("zzz");

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

function testFeatures(userId) {
	console.log("Testing features for user "+userId+"...");
	var req = {};
	var ri = {};
	var si = {};
	si.userId = userId;
	req.subjectInfo = si;

	ri.deviceCap = "web.contact";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));

	ri.deviceCap = "web.contact.write";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));

	ri.deviceCap = "web.calendar";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));

	ri.deviceCap = "web.calendar.write";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));

	ri.deviceCap = "web.camera";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));

	ri.deviceCap = "web.discovery";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.deviceCap+": "+ruleEffectDescription(res));
}

runPolicyTest();
