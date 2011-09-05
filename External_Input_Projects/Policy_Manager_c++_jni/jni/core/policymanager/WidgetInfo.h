/*
 * WidgetInfo.h
 *
 *  Created on: Jul 26, 2010
 *      Author: Lifebook
 */

#ifndef WIDGETINFO_H_
#define WIDGETINFO_H_

#include <string>
#include <vector>
#include <map>
#include "xmltools/tinyxml.h"
#include "core/Environment.h"
#include "core/BondiDebug.h"

/*
#ifdef WINDOWS
    #include <direct.h>
    #define getCurrentDir _getcwd
#else
    #include <unistd.h>
    #define getCurrentDir getcwd
 #endif
*/
using namespace std;

class WidgetInfo
{
private:
	TiXmlDocument *widgetInfoDocument;
//	static string widgetInfoFilename;
//	static string getCurrentPath();
	
	TiXmlElement* getWidget(const string &);
	
public:
	WidgetInfo(bool);
	void addResource(const string &, const string &, const string &);
//	static string getWidgetInfoFilename();
	void setResources(const string &, vector<pair<string, string>* >&);
	void setSubjectsInfo(const string & , vector<pair<string, string>* >&);
	
	vector<pair<string, string>*>& getResources(const string &);
	map<string, vector<string>*>& getSubjectInfo(const string &);
	bool removeWidget(const string &);
	bool save();
	virtual ~WidgetInfo();
};

#endif /* WIDGETINFO_H_ */
