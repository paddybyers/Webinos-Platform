/*******************************************************************************
 * Copyright 2011 Istituto Superiore Mario Boella (ISMB)
 *  
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

#ifndef MORK_AB_H
#define MORK_AB_H

#include "MorkParser.h"
#include <string>
#include <sstream> 
#include <map>

//TODO map against this: https://developer.mozilla.org/en/nsIAbCard%2F%2FThunderbird3
//TODO return consistent ABEntry and handle them correctly in node.js
///Address book params
const char constFirstName[] = "FirstName";
const char constLastName[] = "LastName";
const char constNickName[] = "NickName";
const char constPrimaryEmail[] = "PrimaryEmail";
const char constHomePhone[] = "HomePhone";
const char constFaxNumber[] = "FaxNumber";
const char constCellularNumber[] = "CellularNumber";
const char constWorkPhone[] = "WorkPhone";
const char constHomeAddress[] = "HomeAddress";
const char constHomeAddress2[] = "HomeAddress2";
const char constHomeCity[] = "HomeCity";
const char constHomeState[] = "HomeState";
const char constHomeZipCode[] = "HomeZipCode";
const char constHomeCountry[] = "HomeCountry";
const char constWorkAddress[] = "WorkAddress";
const char constWorkAddress2[] = "WorkAddress2";
const char constWorkCity[] = "WorkCity";
const char constWorkState[] = "WorkState";
const char constWorkZipCode[] = "WorkZipCode";
const char constWorkCountry[] = "WorkCountry";
const char constJobTitle[] = "JobTitle";
const char constDepartment[] = "Department";
const char constCompany[] = "Company";
const char constWebPage1[] = "WebPage1";
const char constWebPage2[] = "WebPage2";
const char constNotes[] = "Notes";

/**
@brief a struct defining an Address Book Entry
*/
typedef struct _ABEntry
{
  public:
    /// Entry ID
    std::string id;

    /// Name
    std::string first_name;
    std::string last_name;
    std::string nick_name;

    /// Telephones/Faxes
    std::string home_tel;
    std::string mobile_tel;
    std::string work_tel;
    std::string fax;

    /// Addresses
    std::string address_work;
    std::string address_home;

    /// Web Page
    std::string web_page;

    /// Email
    std::string email;

    /// Notes
    std::string notes;
} ABEntry;

typedef std::map< int, ABEntry > AbeMap;
typedef std::map< std::string, std::string > RawAbeMap;

class MorkAddressBook
{
  private:
    AbeMap abes_;
    
    /**
      get entry fields from raw address book map
    */
    void fromRawAbe( RawAbeMap &rawAbe, std::string &retText, const char *paramTitle );
    
    /**
      append an address to a book entry
    */
    inline void appendAddress( std::string &text, const std::string &add )
    {
      if ( !add.empty() )
      {
        text += add;
        text += ", ";
      }
    }
    
  public:
    /**
      class constructor
    */
    MorkAddressBook(){};
    
    /**
      class destructor
    */
    ~MorkAddressBook(){};
    
    /**
      @return address book map
    */
    AbeMap getAB(){return this->abes_;}
    
    /**
      add a new entry to the address book
    */
    void addEntry( RawAbeMap &rawAbe, ABEntry &abe );

    /**
      Opens address book 
      @param path - path to the address book file
      @return - true if success, otherwise false
    */
    bool openAddressBook( const std::string& path );
};


#endif //MORK_AB
