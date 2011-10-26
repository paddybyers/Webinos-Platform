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
#include <sstream>
#include <iostream>

extern "C"
{
#include <gcalendar.h>
#include <gcontact.h>
#include <internal_gcal.h>
}


///Base 64 encoding routine from http://en.wikibooks.org/wiki/Algorithm_Implementation/Miscellaneous/Base64#C.2B.2B
///Lookup table for encoding
///If you want to use an alternate alphabet, change the characters here
const static char encodeLookup[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const static char padCharacter = '=';
/**
 *
 * @param inputBuffer buffer to be base64-encoded
 * @return
 */
std::string base64Encode(std::vector<unsigned char> inputBuffer);

/**
 @brief a struct defining an Address Book Entry
 */
typedef struct _W3CContact
{
public:
    /// Entry ID
    std::string id;
    std::string displayName;
    std::map<std::string, std::string> name;
    std::string nickname;
    std::vector<std::map<std::string, std::string> > phoneNumbers;
    std::vector<std::map<std::string, std::string> > emails;
    std::vector<std::map<std::string, std::string> > addresses;
    std::vector<std::map<std::string, std::string> > ims;
    std::vector<std::map<std::string, std::string> > organizations;
    std::string revision;
    std::string birthday;
    std::string gender; //NOT MAPPED
    std::string note;
    std::vector<std::map<std::string, std::string> > photos; //TODO
    std::vector<std::string> categories; //NOT MAPPED
    std::vector<std::map<std::string, std::string> > urls;
    std::string timezone; //NOT MAPPED

} W3CContact;

typedef std::vector<W3CContact> W3CContacts;

//Overload of << operator for W3CContact for nice output function writing (mainly for debug)
std::ostream& operator<<(std::ostream& out, const W3CContact &w3c);

class GCalAddressBook
{
private:
    ///Username for authentication
    std::string m_username;

    ///Password for authentication
    std::string m_password;

    ///Authentication Token
    gcal_t m_gcalToken;

    /**
     Map a GCal contact to a W3CContacts
     */
    void fromGCalContact(gcal_contact_t gContact, W3CContact &w3cContact);

    /**
     *
     * @param gsc
     * @return
     */
    std::map<std::string, std::string> parseStructuredName(gcal_structured_subvalues_t gsc);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parsePhoneNumber(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parseEmails(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parseAddresses(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parseIms(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parseOrganizations(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parsePhotos(gcal_contact_t gContact);

    /**
     *
     * @param gContact
     * @return
     */
    std::vector<std::map<std::string, std::string> > parseUrls(gcal_contact_t gContact);

public:

    /**
     * Class Constructor
     */
    GCalAddressBook();

    /**
     * Class Destructor
     */
    ~GCalAddressBook();

    /**
     * Perform login, storing token, username and password
     * @param username
     * @param password
     * @return
     */
    bool authenticate(std::string username, std::string password);

    /**
     * Perform logout
     */
    void logout();

    /**
     * Gives Back a vector of address book entries
     * @return
     */
    W3CContacts getContacts();

};
#endif //G_ADDRESS_BOOK_H
