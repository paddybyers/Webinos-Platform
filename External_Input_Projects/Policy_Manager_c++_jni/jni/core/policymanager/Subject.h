/*
 * Subject.h
 *
 *  Created on: 08/set/2010
 *      Author: Giuseppe La Torre - Salvatore Monteleone
 */

#ifndef SUBJECT_H_
#define SUBJECT_H_

#include "core/policymanager/Request.h"
#include "xmltools/common.h"
#include <map>
#include <string>
#include <vector>
#include <algorithm>


using namespace std;

typedef struct {
	string equal_func;
//	string match;
	string value;
	string mod_func;
} match_info_str;


class Subject
	{
	
private:
	map<string,vector<match_info_str*> > info;
	
public:
	Subject(TiXmlElement*);
	virtual ~Subject();
	
	bool match(Request*);
	};

#endif /* SUBJECT_H_ */
