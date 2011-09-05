/*
 * PolicySet.cpp
 *
 *  Created on: 10/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#include "PolicySet.h"
#include "debug.h"

PolicySet::PolicySet(TiXmlElement* set) : IPolicyBase(set){
	iType = POLICY_SET;
	policyCombiningAlgorithm = (set->Attribute("combine")!=NULL) ? set->Attribute("combine") : deny_overrides_algorithm;
	
	//init subjects
	TiXmlNode * target = set->FirstChild("target");
	if(target){
		for(TiXmlElement * child = (TiXmlElement*)target->FirstChild("subject"); child;
				child = (TiXmlElement*)child->NextSibling() ) {
			subjects.push_back(new Subject(child));
		}
	}
	
	for(TiXmlNode * node = (TiXmlNode*)set->FirstChild(); node;
			node = (TiXmlNode*)node->NextSibling() ) {
		
		TiXmlElement * child = dynamic_cast<TiXmlElement*>(node);
		if(child == NULL)
			continue;
	
		if(child->ValueStr() == "policy-set"){
			PolicySet * set = new PolicySet(child);
			policysets.push_back(set);
			sortArray.push_back(set);
		}
		else if(child->ValueStr() == "policy"){
			Policy * policy = new Policy(child);
			policies.push_back(policy);
			sortArray.push_back(policy);
		}
	}

//	LOGD("[PolicySet]  : subjects size : %d",subjects.size());
//	LOGD("[PolicySet]  : policies size : %d",policies.size());
//	LOGD("[PolicySet]  : policysets size : %d",policysets.size());
}

PolicySet::PolicySet(IPolicyBase* policy) : IPolicyBase(policy){
	iType = POLICY_SET;
	policyCombiningAlgorithm = deny_overrides_algorithm;
	policies.push_back((Policy*)policy);
	sortArray.push_back(policy);
	this->description = policy->description;
}

PolicySet::~PolicySet()
	{
	// TODO Auto-generated destructor stub
	}


bool PolicySet::matchSubject(Request* req){
	
	if(subjects.size() == 0)
		return true;
	else
		for(int i=0; i<subjects.size(); i++){
			if(subjects[i]->match(req))
				return true;
		}
	return false;
}

Effect PolicySet::evaluatePolicies(Request * req){
	
	for(int i=0; i<policies.size(); i++){
			LOGD("policies[%d] = %s",i,policies[i]->description.data());
	}
	
 	if(req->getResourceAttrs().size() == 0){
		return PERMIT;
	}
	
	if(policyCombiningAlgorithm == deny_overrides_algorithm){
		LOGD("[PolicySet] deny_overrides algorithm");
		int effects_result[] = {0,0,0,0,0,0,0};
		for(int i=0; i<sortArray.size(); i++){
			effects_result[sortArray[i]->evaluate(req)]++;
			if(effects_result[DENY] > 0)
				return DENY;
		}
/*		
		for(int i=0; i<policies.size(); i++){
			effects_result[policies[i]->evaluate(req)]++;
			if(effects_result[DENY] > 0)
				return DENY;
		}

//		PolicySets evaluation		
		for(int i=0; i<policysets.size(); i++){
			effects_result[policysets[i]->evaluate(req)]++;
			if(effects_result[DENY] > 0)
				return DENY;
		}
*/
/*		
		LOG("[PolicySet] (0) PERMIT "<<effects_result[0]);
		LOG("[PolicySet] (1) DENY "<<effects_result[1]);
		LOG("[PolicySet] (2) ONESHOT "<<effects_result[2]);
		LOG("[PolicySet] (3) SESSION "<<effects_result[3]);
		LOG("[PolicySet] (4) BLANKET "<<effects_result[4]);
		LOG("[PolicySet] (5) UNDETERMINED "<<effects_result[5]);
*/		
		if(effects_result[UNDETERMINED])
			return UNDETERMINED;
		if(effects_result[PROMPT_ONESHOT])
			return PROMPT_ONESHOT;
		if(effects_result[PROMPT_SESSION])
			return PROMPT_SESSION;
		if(effects_result[PROMPT_BLANKET])
			return PROMPT_BLANKET;
		if(effects_result[PERMIT])
			return PERMIT;
		return INAPPLICABLE;		
	}
	else if(policyCombiningAlgorithm == permit_overrides_algorithm){
		LOGD("[PolicySet] permit_overrides algorithm");
		int effects_result[] = {0,0,0,0,0,0,0};
		
		for(int i=0; i<sortArray.size(); i++){
			effects_result[sortArray[i]->evaluate(req)]++;
			if(effects_result[PERMIT] > 0)
				return PERMIT;
		}
/*		
		for(int i=0; i<policies.size(); i++){
			effects_result[policies[i]->evaluate(req)]++;
			if(effects_result[PERMIT] > 0)
				return PERMIT;
		}
		
//		PolicySets evaluation		
		for(int i=0; i<policysets.size(); i++){
			effects_result[policysets[i]->evaluate(req)]++;
			if(effects_result[PERMIT] > 0)
				return PERMIT;
		}
*/		
		if(effects_result[UNDETERMINED])
			return UNDETERMINED;
		if(effects_result[PROMPT_BLANKET])
			return PROMPT_BLANKET;
		if(effects_result[PROMPT_SESSION])
			return PROMPT_SESSION;
		if(effects_result[PROMPT_ONESHOT])
			return PROMPT_ONESHOT;
		if(effects_result[DENY])
			return DENY;
		return INAPPLICABLE;
	}
	else if(policyCombiningAlgorithm == first_matching_target_algorithm){
		LOGD("[PolicySet] first_matching_target algorithm");
		for(int i=0; i<sortArray.size(); i++){
			LOGD("[PolicySet] try eval %s",sortArray[i]->description.data());
			if(sortArray[i]->matchSubject(req)){
				LOGD("[PolicySet] eval %s",sortArray[i]->description.data());
				return sortArray[i]->evaluate(req);
			}
		}
		return INAPPLICABLE;
        }
	return INAPPLICABLE;
}

Effect PolicySet::evaluate(Request * req){
	if(matchSubject(req)){
		if(policies.size()==	0 && policysets.size()==0){
			return PERMIT;
		}
		else{
			return evaluatePolicies(req);	
		}
	}
	else
		return INAPPLICABLE;	
}