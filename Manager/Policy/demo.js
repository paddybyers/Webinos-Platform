
// This test works with the policy file called  "policy-demo.xml"

var pmlib;
var res;
var pm;

function runPolicyTest() {
	try {
		console.log("Loading policy module...");
		
		pmlib = require('./policymanager.js');
		
		try {
			pm = new pmlib.policyManager();
			console.log("Load success...");
		}
		catch(e) {
			console.log("Load error: "+e.message);
			return;
		}

		testFeatures("user1");
		testFeatures("user2");
		testFeatures("user3");

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

	console.log("");
	console.log("Testing features for user "+userId+"...");
	var req = {};
	var ri = {};
	var si = {};
	si.userId = userId;
	req.subjectInfo = si;

	ri.apiFeature = "http://www.w3.org/ns/api-perms/calendar.read";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.apiFeature+": "+ruleEffectDescription(res));

	ri.apiFeature = "http://www.w3.org/ns/api-perms/contacts.read";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.apiFeature+": "+ruleEffectDescription(res));

	ri.apiFeature = "http://webinos.org/api/messaging";
	req.resourceInfo = ri;
	res = pm.enforceRequest(req);
	console.log(req.resourceInfo.apiFeature+": "+ruleEffectDescription(res));

}

runPolicyTest();
