/*
 * Condition.h
 *
 *  Created on: 07/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef CONDITION_H_
#define CONDITION_H_

//#include "Policy.h"
#include "Globals.h"
#include "xmltools/common.h"
#include "Subject.h"
#include <vector>
#include <map>
using namespace std;



class Condition
	{
	
private:
	Combine									combine;
	vector<Condition*>						conditions;
	map<string, vector<match_info_str*> >	resource_attrs;
	map<string, vector<match_info_str*> >	subject_attrs;
	map<string, vector<match_info_str*> >	environment_attrs;
	
	ConditionResponse evaluateFeatures(Request*);
	ConditionResponse evaluateCapabilities(Request*);
	ConditionResponse evaluateEnvironment(Request*);
	
public:
	Condition(TiXmlElement*);
	virtual ~Condition();
	ConditionResponse evaluate(Request *);
	
	};

#endif /* CONDITION_H_ */
