/*
 * IPolicyBase.cpp
 *
 *  Created on: 14/ott/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#include "IPolicyBase.h"
/*
string IPolicyBase::first_matching_target_algorithm = "first-matching-target";
string IPolicyBase::deny_overrides_algorithm	= "deny-overrides";
string IPolicyBase::permit_overrides_algorithm	= "permit-overrides";
string IPolicyBase::first_applicable_algorithm  = "first-applicable";
*/
IPolicyBase::IPolicyBase(TiXmlElement* elem)
	{
	description = (elem->Attribute("description")!=NULL) ? elem->Attribute("description") : "no_value";
	// TODO Auto-generated constructor stub

	}

IPolicyBase::IPolicyBase(IPolicyBase* base)
	{
	// TODO Auto-generated constructor stub

	}

IPolicyBase::~IPolicyBase()
	{
	// TODO Auto-generated destructor stub
	}

bool IPolicyBase::matchSubject(Request*){}

Effect IPolicyBase::evaluate(Request *){}

PolicyType IPolicyBase::get_iType(){
	return POLICY_SET;
}
