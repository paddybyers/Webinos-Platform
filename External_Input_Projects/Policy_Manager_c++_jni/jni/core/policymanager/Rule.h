/*
 * Rule.h
 *
 *  Created on: 07/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef RULE_H_
#define RULE_H_

#include "Condition.h"
#include "IPolicyBase.h"

class Rule
	{
	
private:
	Effect 		effect;
	Condition* 	condition;
	
public:
	Rule(TiXmlElement*);
	virtual ~Rule();
	
	Effect evaluate(Request*);
	static Effect string2effect(const string &);
	
	};

#endif /* RULE_H_ */
