/*
 * SecurityManager_Android.h
 *
 *  Created on: 13/nov/2010
 *      Author: Giuseppe La Torre
 */

#ifndef SECURITYMANAGER_ANDROID_H_
#define SECURITYMANAGER_ANDROID_H_
#include <stdlib.h>
#include "SecurityManager.h"
#include "crypto/CryptoManager_Android.h"

class SecurityManager_Android : public SecurityManager
	{
private:
	void setCryptoManagerInstance();

public:
	SecurityManager_Android(const string &);
	virtual ~SecurityManager_Android();
	Action promptToUser(Effect,map<string, vector<string>*>&);	
	
	Effect check_INSTALL(Request*);
	Effect check_LOAD(Request*);
	Effect check_INVOKE(Request*);

	string handleEffect(Effect effect, Request* req) ;
};

#endif /* SECURITYMANAGER_ANDROID_H_ */
