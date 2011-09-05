/*
 * SecurityManager.h
 *
 *  Created on: 25/mag/2010
 *      Author: Giuseppe La Torre
 */

#ifndef SECURITYMANAGER_H_
#define SECURITYMANAGER_H_


#include "Globals.h"
#include "core/Environment.h"
#ifdef QT
	#include "crypto/CryptoManager_Qt.h"
#endif

#ifdef JNI
	#include "crypto/CryptoManager_Android.h"
#endif

#include "core/policymanager/PolicyManager.h"
#include "core/policymanager/Request.h"
#include "core/policymanager/WidgetInfo.h"


#include <string>
#include <map>
#include <vector>
using namespace std;

#ifdef QT
#include "core/BondiDebug.h"
#include <QObject>
	class SecurityManager : public QObject {
#endif
#ifdef JNI
#include "debug.h"
	class SecurityManager {
#endif

protected:
	PolicyManager						* policyManager;
	WidgetInfo 						* widgetInfo;
	CryptoManager						* cryptoManager;
//	map<string,vector<string>*> 			ht_API_feature_set;
//	map<string,bool> 					ht_API_feature;
//	map<string,vector<string>* > 			ht_dev_cap;
	map<string, Action> decision_map;
	map<string, Action> param_map;

//	vector<string>* getCapabilityFromFeature(vector<string>*);
	
public:	
	SecurityManager();
	SecurityManager(const string &);
	SecurityManager(CryptoManager*);
	virtual ~SecurityManager();
	bool validateAllSignatures(const vector<string> &);
	bool validateAllReferences(const string widgetRootPath);
	void saveValidatedInfo(const string widgetRootPath);
	bool handleAction(Action, const char*, const char* param_digest_str = NULL);
	string getPolicyName();

	void updateWidgetInfo(const string&, const string&);
	bool removeFromWidgetInfo(const string &);
	void saveWidgetInfo();
	bool verifyWidgetInfo();
//	string getParent(const string&);
//	bool isImplemented(const string& feature);
};

#endif /* SECURITYMANAGER_H_ */
