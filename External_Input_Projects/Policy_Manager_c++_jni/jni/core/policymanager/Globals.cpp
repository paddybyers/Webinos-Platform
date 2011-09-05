/*
 * Globals.cpp
 *
 *  Created on: 12/nov/2010
 *      Author: Giuseppe La Torre
 */

#include "Globals.h"


string modFunction(const string& func, const string& val){
	// func = {scheme, host, authority, scheme-authority, path}
	int pos = val.find(":");
	int pos1 = val.find_last_of("/",pos+2);
	int pos2 = val.find("/",pos1+1);
	
	if(func == "scheme"){
		if(pos != string::npos)
			return val.substr(0,pos);
	}
	else if(func == "authority" || func == "host"){	
		string authority = val.substr(pos1+1, pos2-pos1-1);
		if(func == "authority")
			return authority;
		else{
			int pos_at = authority.find("@")+1;
			int pos3 = authority.find(":");
			if(pos_at == string::npos)
				pos_at = 0;
			if(pos3 == string::npos)
				pos3 = authority.length();
			return authority.substr(pos_at, pos3-pos_at);
		}
	}
	else if(func == "scheme-authority"){
		if(pos2-pos1 == 1)
			return "";
		return val.substr(0, pos2);
	}
	else if(func == "path"){
		int pos4 = val.find("?");
		if(pos4 == string::npos)
			pos4 = val.length();
		return val.substr(pos2, pos4-pos2);
	}
	return "";
}

