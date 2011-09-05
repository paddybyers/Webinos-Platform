/*
 * IPolicyBase.h
 *
 *  Created on: 14/ott/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef IPOLICYBASE_H_
#define IPOLICYBASE_H_


#include "core/BondiDebug.h"
#include "Request.h"

#include <string>
using namespace std;

#include "Globals.h"
/*
enum PolicyType {POLICY_SET, POLICY};
enum Effect {PERMIT, DENY, PROMPT_ONESHOT, PROMPT_SESSION, PROMPT_BLANKET, UNDETERMINED, INAPPLICABLE};
enum Combine {AND, OR};
enum ConditionResponse {NOT_DETERMINED=-1, NO_MATCH=0, MATCH=1};
*/
class IPolicyBase
	{
public:
	string description;
	IPolicyBase(TiXmlElement*);
	IPolicyBase(IPolicyBase*);
	virtual ~IPolicyBase();
	
	virtual bool matchSubject(Request* req);
	virtual Effect evaluate(Request * req);
	virtual PolicyType get_iType();
	
protected:
	PolicyType iType;
/*	static string 		first_matching_target_algorithm;
	static string 		deny_overrides_algorithm;
	static string 		permit_overrides_algorithm;
	static string 		first_applicable_algorithm;
*/
	};

#endif /* IPOLICYBASE_H_ */
