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

#include "gAddressBook.h"
#include <cstring>

std::ostream& operator<<(std::ostream& out, const RawContact &rc )
{
  RawContact::const_iterator iter;
  out<<"{"<<std::endl;
  for ( iter = rc.begin(); iter != rc.end(); iter++ )
  {
    out<<iter->first<<": "<<iter->second<<std::endl;
  }
  out<<"}"<<std::endl;
  return out;
}

GCalAddressBook::GCalAddressBook()
{

}

GCalAddressBook::~GCalAddressBook()
{
  if (!m_password.empty())
    logout();
}


bool GCalAddressBook::authenticate(std::string username, std::string password)
{
  int resultCode=-1;
  m_username=username;
  m_password=password;

  if(!(m_gcalToken = gcal_new(GCONTACT)))
    return false;
  
  resultCode = gcal_get_authentication(m_gcalToken, (char*)m_username.c_str(), (char*)m_password.c_str());
  //gcal_get_authentication returns 0 if success!
  
  return (resultCode==0);
}

void GCalAddressBook::logout()
{
  gcal_destroy(m_gcalToken);
  //TODO shall we delete credentials?
  m_username="";
  m_password="";
}

std::vector<RawContact> GCalAddressBook::getContacts()
{
  struct gcal_contact_array remoteContacts;
  int result = gcal_get_contacts(m_gcalToken, &remoteContacts);
  uint numOfContacts=remoteContacts.length;

  gcal_contact_t remoteContactEntry;
  
  //Let's pre-allocate the vector for efficiency sake
  std::vector<RawContact> contactsVec(numOfContacts);
  
  if(result ==0 ) //if can't get contacts, return empty vector
  {
    for (uint i=0;i<numOfContacts;i++) 
    {
      remoteContactEntry = gcal_contact_element(&remoteContacts, i);
      if(!remoteContactEntry)
        break;
      fromGCalContact(remoteContactEntry,contactsVec.at(i));
    }
    gcal_cleanup_contacts(&remoteContacts);
  }
  return contactsVec;
}

bool GCalAddressBook::addContact(RawContact &entry)
{
  //TODO use structured entries!!!: gcal_contact_get_structured_entry(contacts[i].structured_name,0,1,"fullName");
  gcal_contact_t gContact;
  struct gcal_contact updated;
  gcal_init_contact(&updated);
  int result=-1;
  if((gContact = gcal_contact_new(NULL))) 
  {
    if(!entry["title"].empty())
      gcal_contact_set_title(gContact, entry["title"].c_str());
    if(!entry["content"].empty())
      gcal_contact_set_content(gContact, entry["content"].c_str());
    if(!entry["email"].empty())
      gcal_contact_set_email(gContact, entry["email"].c_str());
    if(!entry["org_name"].empty())
      gcal_contact_set_organization(gContact, entry["org_name"].c_str());
    if(!entry["org_title"].empty())
      gcal_contact_set_profission(gContact, entry["org_title"].c_str());
    if(!entry["phone"].empty())
      gcal_contact_set_phone(gContact, entry["phone"].c_str());
//        if(!entry["address"].empty()) //TODO:return error. Label?!
//          gcal_contact_set_address(gContact, entry["address"].c_str());
    
    result = gcal_create_contact(m_gcalToken, gContact, &updated);
  }
//  else
//    std::cout<<"DBG toGCalContact() ERROR"<<std::endl;


  return (result==0);

}

bool GCalAddressBook::delContact(std::string name)
{
//  struct gcal_contact_array remoteContacts;
//  int result = gcal_get_contacts(m_gcalToken, &remoteContacts);
//  uint numOfContacts=remoteContacts.length;
//  
//  for (uint i=0;i<numOfContacts;i++) 
//  {
//    gcal_contact_t remoteContactEntry = gcal_contact_element(&remoteContacts, i);
//    if(!remoteContactEntry)
//      break;
//    if(name==gcal_contact_get_title(remoteContactEntry))
//    {  
//      std::string contact_to_delete = std::string (gcal_contact_get_id(remoteContactEntry));
//      gcal_contact_set_id(remoteContactEntry, contact_to_delete.c_str());
//      result = gcal_erase_contact(m_gcalToken,remoteContactEntry);
//      break; //break at first occurrence of name
//    }
//  }
  gcal_contact_t contact;
  char* contact_to_delete=NULL;
  size_t i;
  int result;

  struct gcal_contact_array remoteContacts;
  gcal_get_contacts(m_gcalToken, &remoteContacts);

  for(i=0;i<remoteContacts.length;++i) 
  {
    contact = gcal_contact_element(&remoteContacts, i);
    if(strcmp(gcal_contact_get_title(contact), name.c_str()) == 0)
    {
      //TODO: there could be more than one contact 
      contact_to_delete = strdup(gcal_contact_get_id(contact));
      break;
    }
  }

  if(contact_to_delete) {
   // printf("DBG: deleting contact id: %s\n", contact_to_delete);
    gcal_contact_set_id(contact, contact_to_delete);
    result = gcal_erase_contact(m_gcalToken, contact);
  }
  
   //printf("DBG: contact %s not found!\n",title);

  //gcal_contact_delete(contact);
  //gcal_cleanup_contacts(&all_contacts);
  //return result;

  return (result==0);

}

bool GCalAddressBook::findContact(std::string name)
{
  struct gcal_contact_array remoteContacts;
  int result = gcal_get_contacts(m_gcalToken, &remoteContacts);
  uint numOfContacts=remoteContacts.length;
  
  bool ret=false;
  
  //if result != 0 (i.e. no contact list, return false)
  for (uint i=0;i<numOfContacts && (result==0);i++) 
  {
    gcal_contact_t remoteContactEntry = gcal_contact_element(&remoteContacts, i);
    if(!remoteContactEntry)
      break;
    if(name==gcal_contact_get_title(remoteContactEntry))
    {  
      ret=true;
      break; //break at first occurrence of name
    }
  }
  
  return ret;
}
