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

#ifndef G_ADDRESS_BOOK_H
#define G_ADDRESS_BOOK_H

#include <string>
#include <map>
#include <vector>

#include <iostream>

extern "C" {
#include <gcalendar.h>
#include <gcontact.h>
#include <internal_gcal.h>
}

typedef std::map<std::string,std::string> RawContact;

//Overload of << operator for RawContact for nice output function writing (mainly for debug)
std::ostream& operator<<(std::ostream& out,const RawContact &rc );


class GCalAddressBook
{
  private:
    //Username for authentication
    std::string m_username;
    
    //Password for authentication
    std::string m_password;
    
    //Authentication Token
    gcal_t m_gcalToken;
  public:
  
    /**
      Class Constructor
    */
    GCalAddressBook();
    
    /**
      Class Destructor
    */
    ~GCalAddressBook();
    
    /**
      Perform login, storing token, username and password
    */
    bool authenticate(std::string username, std::string password);
    
    /**
      Perform logout
    */
    void logout();
    
    /**
      Gives Back a vector of address book entries
    */
    //gcal_contact_array getContacts();
    std::vector<RawContact> getContacts();
    
    /**
      Add a new entry
    */
    bool addContact(RawContact &entry);
    
    /**
      Delete contact by name
      TODO find a better way to do this?
    */
    bool delContact(std::string name);
    
    /**
      Find a contact by name
      TODO find a better way to do this?
      @param name of the contact to be found
      @return true if found
    */
    bool findContact(std::string name);
    
    /**
      Map a GCal contact to a RawContact
    */
    inline void fromGCalContact(gcal_contact_t gContact, RawContact & rawContact)
    {
      //NULL check is necessary to avoid crash
      //TODO use extended email, address, phone and name fields
      rawContact["id"]=(gcal_contact_get_id(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_id(gContact)));
      rawContact["updated"]=(gcal_contact_get_updated(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_updated(gContact)));
      rawContact["title"]=(gcal_contact_get_title(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_title(gContact)));  
      rawContact["edit_uri"]=(gcal_contact_get_url(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_url(gContact)));
      rawContact["content"]=(gcal_contact_get_content(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_content(gContact)));
      rawContact["email"]=(gcal_contact_get_email(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_email(gContact)));
//    rawContact["im"]=std::string(gcal_contact_get_im(gContact));      //TODO: not implemented in libgcal 0.9.1
      rawContact["org_name"]=(gcal_contact_get_organization(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_organization(gContact)));
      rawContact["org_title"]=(gcal_contact_get_profission(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_profission(gContact)));
      rawContact["phone"]=(gcal_contact_get_phone(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_phone(gContact)));
      rawContact["photo"]=(gcal_contact_get_photo(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_photo(gContact)));
//    //TODO:add photodata, photolength
      rawContact["post_address"]=(gcal_contact_get_address(gContact)==NULL ? std::string("") : std::string(gcal_contact_get_address(gContact)));
    }
    

};










#endif //G_ADDRESS_BOOK_H
