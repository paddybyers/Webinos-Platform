/*
 * Request.h
 *
 *  Created on: 25/mag/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef REQUEST_H_
#define REQUEST_H_

#include <vector>
#include <map>
#include "xmltools/tinyxml.h"
#include "core/Environment.h"
using namespace std;

#ifdef QT_MOBILITY
    #include <qsysteminfo.h>
    QTM_USE_NAMESPACE
#endif

class Request
	{	
private:
    string widgetRootPath;
	map<string, vector<string>*>	subject_attrs;
	map<string, vector<string>*>	resource_attrs;
	map<string, string>				environment_attrs;
	string request_subject_text;
	string request_resource_text;
	string request_environment_text;
	
	TiXmlElement* getXmlSubjectTag();
	TiXmlElement* getXmlResourcesTag();
	TiXmlElement* getXmlEnvironmentTag();
	
public:
	Request(const string& widgetRootPath, map<string, vector<string>*>& resources);
	Request(const string& widgetRootPath, map<string, vector<string>*>& resources, map<string,string>&environment);
	Request(map<string, vector<string>*>&, map<string, vector<string>*>&);
	virtual ~Request();
	
	TiXmlDocument* getXmlDocument();
	void saveXmlFile(const string&);
	
	map<string, vector<string>*>&	getSubjectAttrs();
	map<string, vector<string>*>&	getResourceAttrs();
	map<string, string>&			getEnvironmentAttrs();
	string getWidgetRootPath();
	string getRequestText();
	string getRequestSubjectText();
	void setSubjectAttrs(map<string, vector<string>*>&);
	void setResourceAttrs(map<string, vector<string>*>&);
};

#endif /* REQUEST_H_ */

