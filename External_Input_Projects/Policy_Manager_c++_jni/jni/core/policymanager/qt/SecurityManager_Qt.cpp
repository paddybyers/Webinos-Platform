/*
 * SecurityManager_Qt.cpp
 *
 *  Created on: 13/nov/2010
 *      Author: Giuseppe La Torre
 */

#include "SecurityManager_Qt.h"


SecurityManager_Qt::SecurityManager_Qt(): SecurityManager(){
	dialog = new BondiDialog();
	connect(dialog->ui.pushButton,SIGNAL(released()),this,SLOT(manageDialog()));
	setCryptoManagerInstance();
	
	/*	
	ht_API_feature[FILESYSTEM_READ] 			= default_value;
	ht_API_feature[FILESYSTEM_WRITE] 			= default_value;
	ht_API_feature[BONDI_PACKAGE_GALLERY] 		= default_value;
	ht_API_feature[BONDI_PACKAGE_APPCONFIG] 	= default_value;
	
	vector<string> * tmp_list = new vector<string>();
	tmp_list->push_back(FILESYSTEM_READ);
	tmp_list->push_back(FILESYSTEM_WRITE);
	ht_API_feature_set[BONDI_PACKAGE_FILESYSTEM] = tmp_list;
	
	ht_API_feature_set[BONDI_PACKAGE_GALLERY] = new vector<string>(1,BONDI_PACKAGE_GALLERY);
	ht_API_feature_set[BONDI_PACKAGE_APPCONFIG] = new vector<string>(1,BONDI_PACKAGE_APPCONFIG);
	
	//Assignment of device capabilities
	tmp_list = new vector<string>();
	tmp_list->push_back("io.file.read");
	ht_dev_cap[FILESYSTEM_READ] = tmp_list;
	tmp_list = new vector<string>();
	tmp_list->push_back("io.file.write");
	ht_dev_cap[FILESYSTEM_WRITE] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("gallery");
	ht_dev_cap[BONDI_PACKAGE_GALLERY] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("appconfig");
	ht_dev_cap[BONDI_PACKAGE_APPCONFIG] = tmp_list;

#if defined QT_MOBILITY || defined JNI
	ht_API_feature[GEOLOCATION_POSITION] 		= default_value;
	ht_API_feature[MESSAGING_SMS_SEND] 			= default_value;
	ht_API_feature[MESSAGING_SMS_SUBSCRIBE] 	= default_value;
	ht_API_feature[MESSAGING_SMS_GET] 			= default_value;
	ht_API_feature[PIM_CONTACT_READ] 			= default_value;
	ht_API_feature[PIM_CONTACT_WRITE] 			= default_value;
	ht_API_feature[BONDI_PACKAGE_DEVICESTATUS] 	= default_value;
	
	tmp_list = new vector<string>();
	tmp_list->push_back(GEOLOCATION_POSITION);
	ht_API_feature_set[BONDI_PACKAGE_GEOLOCATION] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back(MESSAGING_SMS_SEND);
	tmp_list->push_back(MESSAGING_SMS_SUBSCRIBE);
	tmp_list->push_back(MESSAGING_SMS_GET);
	ht_API_feature_set[BONDI_PACKAGE_MESSAGING] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back(PIM_CONTACT_WRITE);
	tmp_list->push_back(PIM_CONTACT_READ);
	ht_API_feature_set[BONDI_PACKAGE_CONTACT] = tmp_list;
	
	ht_API_feature_set[BONDI_PACKAGE_DEVICESTATUS] = new vector<string>(1,BONDI_PACKAGE_DEVICESTATUS);	
	
	//Assignment of device capabilities
	tmp_list = new vector<string>();
	tmp_list->push_back("location.position");
	ht_dev_cap[GEOLOCATION_POSITION] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("messaging.sms.send");
	ht_dev_cap[MESSAGING_SMS_SEND] = tmp_list;	
	
	tmp_list = new vector<string>();
	tmp_list->push_back("messaging.sms.subscribe");
	ht_dev_cap[MESSAGING_SMS_SUBSCRIBE] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("messaging.sms.get");
	ht_dev_cap[MESSAGING_SMS_GET] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("pim.contact.read");
	ht_dev_cap[PIM_CONTACT_READ] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("pim.contact.write");
	ht_dev_cap[PIM_CONTACT_WRITE] = tmp_list;
#endif

#if defined QT_MOBILITY || defined JNI
	ht_API_feature[PIM_CALENDAR_READ] 			= default_value;
	ht_API_feature[PIM_CALENDAR_WRITE] 			= default_value;
	ht_API_feature[BONDI_PACKAGE_UI] 			= default_value;
	
	tmp_list = new vector<string>();
	tmp_list->push_back(PIM_CALENDAR_READ);
	tmp_list->push_back(PIM_CALENDAR_WRITE);
	ht_API_feature_set[BONDI_PACKAGE_CALENDAR] = tmp_list;
	
	ht_API_feature_set[BONDI_PACKAGE_UI] = new vector<string>(1,BONDI_PACKAGE_UI);
	
	//Assignment of device capabilities
	tmp_list = new vector<string>();
	tmp_list->push_back("pim.calendar.read");
	ht_dev_cap[PIM_CALENDAR_READ] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("pim.calendar.write");
	ht_dev_cap[PIM_CALENDAR_WRITE] = tmp_list;
	
	tmp_list = new vector<string>();
	tmp_list->push_back("ui");
	ht_dev_cap[BONDI_PACKAGE_UI] = tmp_list;
#endif
*/
}

SecurityManager_Qt::~SecurityManager_Qt(){}

void SecurityManager_Qt::setCryptoManagerInstance(){
	LOG("SecurityManager_Qt] : set CryptoManager_Qt");
	SecurityManager::cryptoManager = new CryptoManager_Qt();
}

bool SecurityManager_Qt::check_INSTALL(Request * req){
#ifndef INSTALL_CHECK	
	return true;
#endif
	if(cryptoManager->validateAllSignatures(req->getWidgetRootPath())){
		vector<pair<string,string>* > tmp = cryptoManager->getResourcesInfo(); 
		widgetInfo->setResources(req->getWidgetRootPath(),tmp);
		tmp = cryptoManager->getSubjectInfo();
		widgetInfo->setSubjectsInfo(req->getWidgetRootPath(), tmp);
		return true;
	}
	return false;	
}

EvalResponse SecurityManager_Qt::check_LOAD(Request * req){
#ifndef LOAD_CHECK
	return EVAL_OK;
#endif	
	//check widgetInfo integrity
	LOG("[SecurityManager] : Check Policy");

	if (!cryptoManager->verifyOnLoad(string(WIDGETINFO_FILE_PREFIX)+"/"+WIDGETINFO_FILE)){
		LOG("[SecurityManager] : widgetInfo file has been corrupted");
		return WGINFO_ERR;
	}
	
	//check all the widget resorces
	vector<pair<string,string>* > resourceInfo = widgetInfo->getResources(req->getWidgetRootPath());	
	if(cryptoManager->validateAllReferences(req->getWidgetRootPath(), resourceInfo)){
		LOG("[SecurityManager] : "<<"Resources check OK, now check the policy");
		string feature_uri = "";
		vector<string>* tmp_list;
		vector<string>* feature_list = new vector<string>();
		
		vector<string>* req_features;
		if(req->getResourceAttrs().find(BONDI_API_FEATURE) != req->getResourceAttrs().end()){ 
			req_features = req->getResourceAttrs()[BONDI_API_FEATURE];
			// Assign features and capabilities
			for(int i=0; i<req_features->size(); i++){
				feature_uri = req_features->at(i);
				if(ht_API_feature_set.find(feature_uri) != ht_API_feature_set.end()){
					tmp_list = ht_API_feature_set[feature_uri];
					for(int j=0; j<tmp_list->size(); j++){
						feature_list->push_back(tmp_list->at(j));
					}
				}
				else if(ht_API_feature.find(feature_uri) != ht_API_feature.end()){
					feature_list->push_back(feature_uri);
				}
			}
			delete req_features;
			req->getResourceAttrs()[BONDI_API_FEATURE] = feature_list;
		}
		
		req->setSubjetAttrs(widgetInfo->getSubjectInfo(req->getWidgetRootPath()));
		
		vector<string>* capability_list = new vector<string>();
		capability_list = getCapabilityFromFeature(feature_list);
		req->getResourceAttrs()[BONDI_DEVICE_CAPABILITY] = capability_list;

#if TARGET == EMULATOR		
		req->saveXmlFile(string(ENV_WGT_PREFIX) + "/Data/request.xml");
#endif
		Effect tmpEffect = policyManager->checkRequest(req);
		bool value = handleEffect(tmpEffect, req);
		if(value)
			return EVAL_OK;
		return POLICY_ERR;
	}
	else{
		LOG("[SecurityManager] : "<<"REFERENCES check FAIL");
		return REF_ERR;
	}
}

bool SecurityManager_Qt::check_INVOKE(Request * req){
#ifndef INVOKE_CHECK
		return true;
#endif
	if(req->getWidgetRootPath() == ENV_MAIN_PAGE_PREFIX)
		return true;
#warning "CHANGE ENV_MAIN_PAGE_PREFIX"
	
	req->setSubjetAttrs(widgetInfo->getSubjectInfo(req->getWidgetRootPath()));
	map<string,vector<string>* > resource_attrs;
	resource_attrs[BONDI_DEVICE_CAPABILITY] = new vector<string>();
	vector<string>* vet;
	for(map<string,vector<string>*>::iterator it=req->getResourceAttrs().begin(); it!=req->getResourceAttrs().end(); it++){
		if(it->first == BONDI_API_FEATURE){
			vet = getCapabilityFromFeature(it->second);
			resource_attrs[it->first] = it->second;
			resource_attrs[BONDI_DEVICE_CAPABILITY]->insert(resource_attrs[BONDI_DEVICE_CAPABILITY]->begin(), vet->begin(), vet->end());
		}
		else if(it->first == BONDI_DEVICE_CAPABILITY){
			resource_attrs[BONDI_DEVICE_CAPABILITY]->insert(resource_attrs[BONDI_DEVICE_CAPABILITY]->begin(), it->second->begin(), it->second->end());
		}
		else{	//param:...
			resource_attrs[it->first] = it->second;
		}
	}
	
	req->setResourceAttrs(resource_attrs);
	
#if TARGET == EMULATOR
	req->saveXmlFile(string(ENV_WGT_PREFIX) + "/Data/runtime_request.xml");
#endif
	
	Effect tmpEffect = policyManager->checkRequest(req);	
	return handleEffect(tmpEffect, req);
}

Action SecurityManager_Qt::promptToUser(Effect effect,map<string, vector<string>*>& res){
	LOG("[SecurityManager_Qt] : promtToUser derived "+res.size());	
	QStringList list;
	switch(effect){
		case UNDETERMINED:
		case PERMIT:
			return ALLOW_THIS_TIME;
		case INAPPLICABLE:
		case DENY:
			return DENY_THIS_TIME;
		case PROMPT_ONESHOT:
			list << "Deny always" << "Deny this time" << "Allow this time";
			break;
		case PROMPT_SESSION:
			list << "Deny always" << "Deny this time" << "Allow this time" << "Deny this session" << "Allow this session";
			break;
		case PROMPT_BLANKET:
			list << "Deny always" << "Deny this time" << "Allow this time" << "Deny this session" << "Allow this session" << "Allow always";
			break;
	}
	
	QStringList resources;
	for(map<string, vector<string>*>::iterator it = res.begin(); it != res.end(); it++){
		vector<string> * tmp = it->second;
		for(int i=0; i<tmp->size(); i++){
			if(it->first == BONDI_API_FEATURE || it->first == BONDI_DEVICE_CAPABILITY)
				resources << QString::fromStdString(tmp->at(i));
			else
				resources << QString::fromStdString(it->first) + " : " + QString::fromStdString(tmp->at(i));
		}
	}	
	dialog->setLabel(resources);
	dialog->setList(list);
	dialog->showMaximized();
	Action action = dialog->getAction();
	LOG("ACTION : "<<action);
	return action;
}


void SecurityManager_Qt::manageDialog(){	
	int choice = -1;
	QString value = dialog->ui.comboBox->currentText();
	if(value == "Allow this time"){
		choice = 0;
	}
	else if(value == "Deny this time"){
		choice = 1;
	}
	else if(value == "Allow this session"){
		choice = 2;
	}
	else if(value == "Deny this session"){
		choice = 3;
	}
	else if(value == "Allow always"){
		choice = 4;	
	}
	else if(value == "Deny always"){
		choice = 5;	
	}
	dialog->done(choice);
}

bool SecurityManager_Qt::handleEffect(Effect effect, Request * req){
	req->getXmlDocument();
	char digest[32];
	int digest_len = cryptoManager->calculateSHA256(req->getRequestText().data(), req->getRequestText().length(), digest);
	char digest_b64[45];
	char * param_digest_b64 = NULL;
	toBase64((unsigned char*)digest, 32, digest_b64);
	digest_b64[44] = '\0';
	
	map<string, vector<string>* > resource_attrs = req->getResourceAttrs();
	
	Action decision = NO_ACTION;
	bool decision_found = false;
	
	if(decision_map.find(digest_b64) != decision_map.end())
	{
		decision = decision_map[digest_b64];
		LOG("A decision for this request was already taken : " << decision);
	}
	else if (resource_attrs.find("param:name") != resource_attrs.end())
	{		
		vector<string> * resource_attr_list = resource_attrs["param:name"];
		string param_map_key;
		
		for (int i = 0; !decision_found && i < resource_attr_list->size(); i++)
		{
			QString path = ENV_WGT_PREFIX + "/" + QString::fromStdString(resource_attr_list->at(i));
			path = path.replace("sdcard","");
			
			QDir tmpdir(path);
			param_digest_b64 = new char[45];
			do
			{
				LOG("Analize path : " << tmpdir.path());
				param_map_key = req->getRequestSubjectText() + tmpdir.path().toStdString();
				digest_len = cryptoManager->calculateSHA256(param_map_key.data(), param_map_key.length(), digest);
				toBase64((unsigned char*)digest, 32, param_digest_b64);
				param_digest_b64[44] = '\0';
				LOG("Check for digest : " << param_digest_b64);
				if(param_map.find(param_digest_b64) != param_map.end())
				{					
					decision = param_map[param_digest_b64];
					decision_found = true;
					LOG("A decision for this request was already taken : "<<decision);
					break;
				}
			}while(tmpdir.cdUp());
			
			delete param_digest_b64;
			
			param_digest_b64 = new char[45];
			param_map_key = req->getRequestSubjectText() + path.toStdString();
			digest_len = cryptoManager->calculateSHA256(param_map_key.data(), param_map_key.length(), digest);	
			toBase64((unsigned char*)digest, 32, param_digest_b64);
			param_digest_b64[44] = '\0';
			LOG("Final digest for "<<path<<" is : " << param_digest_b64);
			
			break; //FIXME
		}
	}	
	
	if(decision == DENY_THIS_SESSION || decision == DENY_ALWAYS){
		return false;
	}
	if(decision == ALLOW_THIS_SESSION || decision == ALLOW_ALWAYS){
		return true;
	}

	decision = promptToUser(effect,req->getResourceAttrs());
	return handleAction(decision, digest_b64, param_digest_b64);

}
