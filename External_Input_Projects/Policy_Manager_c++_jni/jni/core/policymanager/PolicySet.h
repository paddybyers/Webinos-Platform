/*
 * PolicySet.h
 *
 *  Created on: 10/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef POLICYSET_H_
#define POLICYSET_H_

#include "xmltools/tinyxml.h"
#include "core/BondiDebug.h"
#include "Policy.h"
#include "IPolicyBase.h"

#include <vector>
using namespace std;

class PolicySet : public IPolicyBase
	{
	
private:
	string 				policyCombiningAlgorithm;
//	vector<void*>		sortArray;
	vector<IPolicyBase*> sortArray;
	vector<PolicySet*>	policysets;
	vector<Policy*> 	policies;
	vector<Subject*> 	subjects;
	
	bool matchSubject(Request*);
	Effect evaluatePolicies(Request*);
//	Effect evaluatePolicySets(Request*);
	
public:
	PolicySet(TiXmlElement*);
	PolicySet(IPolicyBase*);
	virtual ~PolicySet();
	
	Effect evaluate(Request *);
	};

#endif /* POLICYSET_H_ */
