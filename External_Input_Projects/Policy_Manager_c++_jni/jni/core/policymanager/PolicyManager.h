/*
 * PolicyManager.h
 *
 *  Created on: 21/mag/2010
 *      Author: Giuseppe La Torre
 */

#ifndef POLICYMANAGER_H_
#define POLICYMANAGER_H_

#include "Request.h"
#include "PolicySet.h"
//#include "debug.h"

#ifdef QT
	#include <QMessageBox>
#endif

class PolicyManager{ 

private:
	PolicySet * policyDocument;
	bool validPolicyFile;
	string policyName;

public:
	PolicyManager();
	PolicyManager(const string &);
	virtual ~PolicyManager();
	Effect checkRequest(Request *);
	void init(const string &);
	string getPolicyName();
};

#endif /* POLICYMANAGER_H_ */
