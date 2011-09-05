/*
 * Policy.h
 *
 *  Created on: 07/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef POLICY_H_
#define POLICY_H_

#include "IPolicyBase.h"
#include "Rule.h"
#include "Subject.h"
#include "debug.h"
//#include "core/QtBondiDebug.h"

class Policy : public IPolicyBase
	{
	
private:
	string 				ruleCombiningAlgorithm;
	vector<Subject*> 	subjects;
	vector<Rule*>		rules;
	
	
public:
	Policy(TiXmlElement*);
	virtual ~Policy();
	
	bool matchSubject(Request*);
	Effect evaluate(Request*);
	PolicyType get_iType();
//	static string modFunction(const string&, const string&);
	
};

#endif /* POLICY_H_ */
