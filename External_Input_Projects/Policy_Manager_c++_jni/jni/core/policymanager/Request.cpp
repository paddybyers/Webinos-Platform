/*
 * Request.cpp
 *
 *  Created on: 25/mag/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#include "Request.h"

Request::Request(map<string, vector<string>*>& info, map<string, vector<string>*>& resources){	
	subject_attrs = info;
	resource_attrs = resources;
	request_subject_text = "";
	request_resource_text = "";
	request_environment_text = "";
	
	string roaming = "";
	string bearer = "unknown";

#ifdef QT_MOBILITY
	QStringList bearer_type;
	bearer_type <<"unknown"<<"gsm"<<"cdma"<<"wcdma"<<"wlan"<<"ethernet"<<"bluetooth"<<"wimax";
	QSystemNetworkInfo systemNetworkInfo;// = new QSystemNetworkInfo();
	if (systemNetworkInfo.networkStatus(systemNetworkInfo.currentMode()) == QSystemNetworkInfo::Roaming){
		if (systemNetworkInfo.currentMobileCountryCode() == systemNetworkInfo.homeMobileCountryCode())
			roaming = "national";
		else
			roaming = "international";
	}
	bearer = bearer_type[systemNetworkInfo.currentMode()];

#endif

	environment_attrs["roaming"] = roaming;
	environment_attrs["bearer-type"] = bearer;
}
	
Request::Request(const string& widgetRootPath, map<string, vector<string>*>& resources){
	this->widgetRootPath = widgetRootPath;
	resource_attrs = resources;
	request_subject_text = "";
	request_resource_text = "";
	request_environment_text = "";
	
	string roaming = "";
	string bearer = "unknown";

#ifdef QT_MOBILITY
	QStringList bearer_type;
	bearer_type <<"unknown"<<"gsm"<<"cdma"<<"wcdma"<<"wlan"<<"ethernet"<<"bluetooth"<<"wimax";
	QSystemNetworkInfo systemNetworkInfo;// = new QSystemNetworkInfo();
	if (systemNetworkInfo.networkStatus(systemNetworkInfo.currentMode()) == QSystemNetworkInfo::Roaming){
		if (systemNetworkInfo.currentMobileCountryCode() == systemNetworkInfo.homeMobileCountryCode())
			roaming = "national";
		else
			roaming = "international";
	}
	bearer = bearer_type[systemNetworkInfo.currentMode()];

#endif

	environment_attrs["roaming"] = roaming;
	environment_attrs["bearer-type"] = bearer;
}

Request::Request(const string& widgetRootPath, map<string, vector<string>*>& resources, map<string,string>&environment){
	this->widgetRootPath = widgetRootPath;
	resource_attrs = resources;
	request_subject_text = "";
	request_resource_text = "";
	request_environment_text = "";
	environment_attrs = environment;
}

Request::~Request(){
	for(map<string,vector<string>*>::iterator it = subject_attrs.begin(); it!=subject_attrs.end(); it++){
		it->second->clear();
		delete it->second;
		it->second = NULL;
	}
	for(map<string,vector<string>*>::iterator it = resource_attrs.begin(); it!=resource_attrs.end(); it++){
		it->second->clear();
		delete it->second;
		it->second = NULL;
	}
}

TiXmlElement* Request::getXmlSubjectTag(){
	TiXmlElement * subject = new TiXmlElement("Subject");
	TiXmlElement * attribute;
	TiXmlElement * attributeValue;
	
	attribute = new TiXmlElement("Attribute");
	attributeValue = new TiXmlElement("AttributeValue");
	attribute->SetAttribute("AttributeId", "class");
	attributeValue->LinkEndChild(new TiXmlText("widget"));
	attribute->LinkEndChild(attributeValue);
	subject->LinkEndChild(attribute);
	
	vector<string>* tmp;
	for(map<string,vector<string>*>::iterator it=subject_attrs.begin(); it!=subject_attrs.end(); it++)
	{
		tmp = it->second;
		for(int i=0; i<tmp->size(); i++){
			attribute = new TiXmlElement("Attribute");
			attributeValue = new TiXmlElement("AttributeValue");
			attribute->SetAttribute("AttributeId", it->first);
			attributeValue->LinkEndChild(new TiXmlText(tmp->at(i)));
			request_subject_text += it->first + ":" + tmp->at(i) + ";";
			attribute->LinkEndChild(attributeValue);
			subject->LinkEndChild(attribute);
		}
	}
	return subject;
}

TiXmlElement* Request::getXmlResourcesTag(){
	TiXmlElement * resources = new TiXmlElement("Resources");
	TiXmlElement * attribute;
	TiXmlElement * attributeValue;
	
	vector<string>* tmp;
	for(map<string,vector<string>*>::iterator it=resource_attrs.begin(); it!=resource_attrs.end(); it++){
		tmp = it->second;
		for(int i=0; i<tmp->size(); i++){
			attribute = new TiXmlElement("Attribute");
			attributeValue = new TiXmlElement("AttributeValue");
			attribute->SetAttribute("AttributeId", it->first);
			attributeValue->LinkEndChild(new TiXmlText(tmp->at(i)));
			request_resource_text += it->first + ":" + tmp->at(i) + ";";
			attribute->LinkEndChild(attributeValue);
			resources->LinkEndChild(attribute);
		}
	}
	return resources;
}


TiXmlElement* Request::getXmlEnvironmentTag(){
	TiXmlElement * resources = new TiXmlElement("Environment");
	TiXmlElement * attribute;
	TiXmlElement * attributeValue;
	
	for(map<string,string>::iterator it=environment_attrs.begin(); it!=environment_attrs.end(); it++){
		attribute = new TiXmlElement("Attribute");
		attributeValue = new TiXmlElement("AttributeValue");
		attribute->SetAttribute("AttributeId", it->first);
		attributeValue->LinkEndChild(new TiXmlText(it->second));
		request_environment_text += it->first + ":" + it->second + ";";
		attribute->LinkEndChild(attributeValue);
		resources->LinkEndChild(attribute);
	}
	return resources;
}


TiXmlDocument* Request::getXmlDocument(){
	TiXmlDocument * requestDoc = new TiXmlDocument();
	TiXmlElement* request = new TiXmlElement("Request");
	request->LinkEndChild(getXmlSubjectTag());
	request->LinkEndChild(getXmlResourcesTag());
	request->LinkEndChild(getXmlEnvironmentTag());
	requestDoc->LinkEndChild(request);
	return requestDoc;
}

// test function
void Request::saveXmlFile(const string& path){
	getXmlDocument()->SaveFile(path);
}

map<string, vector<string>*>& Request::getSubjectAttrs(){
	return subject_attrs;
}

map<string, vector<string>*>& Request::getResourceAttrs(){
	return resource_attrs;
}

map<string,string>& Request::getEnvironmentAttrs(){
	return environment_attrs;
}

string Request::getRequestText(){
	return request_subject_text + request_resource_text + request_environment_text;
}

string Request::getRequestSubjectText(){
	return request_subject_text;
}

string Request::getWidgetRootPath(){
	return widgetRootPath;
}

void Request::setSubjectAttrs(map<string, vector<string>*>& subjects){
	subject_attrs = subjects;
}

void Request::setResourceAttrs(map<string, vector<string>*>& resources){
	resource_attrs = resources;
}
