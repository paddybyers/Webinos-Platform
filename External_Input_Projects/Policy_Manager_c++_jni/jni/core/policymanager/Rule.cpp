/*
 * Rule.cpp
 *
 *  Created on: 07/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#include "Rule.h"
#include "debug.h"

Rule::Rule(TiXmlElement* rule){
	effect = (rule->Attribute("effect") != NULL) ? string2effect(rule->Attribute("effect")) : UNDETERMINED;
	if(rule->FirstChild("condition")){
		condition = new Condition((TiXmlElement*)rule->FirstChild("condition"));
	}
	else
		condition = NULL;
}

Rule::~Rule()
	{
	// TODO Auto-generated destructor stub
	}


Effect Rule::string2effect(const string & effect_str){
	if(effect_str == "permit")
		return PERMIT;
	else if(effect_str == "deny")
		return DENY;
	else if(effect_str == "prompt-oneshot")
		return PROMPT_ONESHOT;
	else if(effect_str == "prompt-session")
		return PROMPT_SESSION;
	else if(effect_str == "prompt-blanket")
		return PROMPT_BLANKET;
	else
		return UNDETERMINED;
}

Effect Rule::evaluate(Request* req){
	
	if(condition){
		ConditionResponse cr = condition->evaluate(req);
//		LOGD("[RULE EVAL] %d",cr); 
		if(cr==MATCH)
			return effect;
		else if (cr==NO_MATCH)
			return INAPPLICABLE;
		else
			return UNDETERMINED;
	}
	else
		return effect;
}
