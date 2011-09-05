/*
 * PolicyManager.cpp
 *
 *  Created on: 21/mag/2010
 *      Author: Giuseppe La Torre
 */

#include "PolicyManager.h"
//#include <android/log.h>
#include "debug.h"

PolicyManager::PolicyManager() {}

PolicyManager::PolicyManager(const string & policyFileName){
	
	TiXmlDocument doc(policyFileName);
	LOGD("Policy manager file : %s",policyFileName.data());

	if (doc.LoadFile())
	{
		LOGD("Policy manager file load ok");
		validPolicyFile = true;
		TiXmlElement * element = (TiXmlElement *)doc.RootElement();
		if(element->ValueStr() == "policy"){
			policyDocument = new PolicySet(new Policy(element));
		}
		else if(element->ValueStr() == "policy-set"){
			policyDocument = new PolicySet(element);
		}
		policyName = policyDocument->description;
	}
	else{
		validPolicyFile = false;
		LOGD("[PolicyManager] Policy file not found");
		policyName = "no_name";
	}
/*	
	if(policyDocument){
		policyName = policyDocument->description;
	}
	else{
		policyName = "no_name";
	}
*/
	LOGD("Policy manager ctor finish");
}

PolicyManager::~PolicyManager() {}

string PolicyManager::getPolicyName(){
	return policyName;
}

Effect PolicyManager::checkRequest(Request * req){
	LOGD("Policy manager start check");
	if(validPolicyFile)
		return policyDocument->evaluate(req);
	else
		return INAPPLICABLE;
}
