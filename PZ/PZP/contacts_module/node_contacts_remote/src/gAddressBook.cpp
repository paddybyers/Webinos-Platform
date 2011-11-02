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

std::ostream& operator<<(std::ostream& out, const W3CContact &w3c)
{
    out << "{" << std::endl;

    out << "id : " << w3c.id << std::endl;
    out << "displayName : " << w3c.displayName << std::endl;

    //structured name
    std::map<std::string, std::string>::const_iterator name_it;
    out << "name : [";
    for (name_it = w3c.name.begin(); name_it != w3c.name.end(); name_it++)
    {
        out << name_it->first << ": " << name_it->second << "; ";
    }
    out << " ]" << std::endl;

    //phone numbers
    out << "phones : [";
    for (size_t i = 0; i < w3c.phoneNumbers.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator phone_it;
        out << "phone #" << i << ": [";
        for (phone_it = w3c.phoneNumbers.at(i).begin(); phone_it != w3c.phoneNumbers.at(i).end(); phone_it++)
        {
            out << phone_it->first << ": " << phone_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    //emails
    out << "emails : [";
    for (size_t i = 0; i < w3c.emails.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator email_it;
        out << "email #" << i << ": [";
        for (email_it = w3c.emails.at(i).begin(); email_it != w3c.emails.at(i).end(); email_it++)
        {
            out << email_it->first << ": " << email_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    //addresses
    out << "addresses : [";
    for (size_t i = 0; i < w3c.addresses.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator addr_it;
        out << "address #" << i << ": [";
        for (addr_it = w3c.addresses.at(i).begin(); addr_it != w3c.addresses.at(i).end(); addr_it++)
        {
            out << addr_it->first << ": " << addr_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    //ims
    out << "ims : [";
    for (size_t i = 0; i < w3c.ims.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator im_it;
        out << "im #" << i << ": [";
        for (im_it = w3c.ims.at(i).begin(); im_it != w3c.ims.at(i).end(); im_it++)
        {
            out << im_it->first << ": " << im_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    //orgs
    out << "organizations : [";
    for (size_t i = 0; i < w3c.organizations.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator org_it;
        out << "org #" << i << ": [";
        for (org_it = w3c.organizations.at(i).begin(); org_it != w3c.organizations.at(i).end(); org_it++)
        {
            out << org_it->first << ": " << org_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    out << "revision : " << w3c.revision << std::endl;
    out << "birthday : " << w3c.birthday << std::endl;
    out << "note : " << w3c.note << std::endl;

    //Urls
    out << "Urls : [";
    for (size_t i = 0; i < w3c.urls.size(); i++)
    {
        std::map<std::string, std::string>::const_iterator url_it;
        out << "url #" << i << ": [";
        for (url_it = w3c.urls.at(i).begin(); url_it != w3c.urls.at(i).end(); url_it++)
        {
            out << url_it->first << ": " << url_it->second << "; ";
        }
        out << " ]" << std::endl;
    }
    out << " ]" << std::endl;

    out << "}" << std::endl;
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
    int resultCode = -1;
    m_username = username;
    m_password = password;
	
    if (!(m_gcalToken = gcal_new(GCONTACT)))
        return false;

    resultCode = gcal_get_authentication(m_gcalToken, (char*) m_username.c_str(), (char*) m_password.c_str());
    //gcal_get_authentication returns 0 if success!
    return (resultCode == 0);
}

void GCalAddressBook::logout()
{
    gcal_destroy(m_gcalToken);
    //TODO shall we delete credentials?
    m_username = "";
    m_password = "";
}

W3CContacts GCalAddressBook::getContacts()
{
    struct gcal_contact_array remoteContacts;
    int result = gcal_get_contacts(m_gcalToken, &remoteContacts);
    uint numOfContacts = remoteContacts.length;

    gcal_contact_t remoteContactEntry;

    //Let's pre-allocate the vector for efficiency sake
    W3CContacts contactsVec(numOfContacts);

    if (result == 0) //if can't get contacts, return empty vector
    {
        for (uint i = 0; i < numOfContacts; i++)
        {
            remoteContactEntry = gcal_contact_element(&remoteContacts, i);
            if (!remoteContactEntry)
                break;
            fromGCalContact(remoteContactEntry, contactsVec.at(i));
        }
        gcal_cleanup_contacts(&remoteContacts);
    }
    return contactsVec;
}

void GCalAddressBook::fromGCalContact(gcal_contact_t gContact, W3CContact &w3cContact)
{
    w3cContact.id = (gcal_contact_get_id(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_id(gContact)));
    w3cContact.displayName = (gcal_contact_get_title(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_title(gContact)));

    gcal_structured_subvalues_t gsc;
    gsc = gcal_contact_get_structured_name(gContact);
    w3cContact.name = parseStructuredName(gsc);

    w3cContact.nickname = (gcal_contact_get_nickname(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_nickname(gContact)));
    w3cContact.phoneNumbers = parsePhoneNumber(gContact);
    w3cContact.emails = parseEmails(gContact);
    w3cContact.addresses = parseAddresses(gContact);
    w3cContact.ims = parseIms(gContact);

    w3cContact.organizations = parseOrganizations(gContact);
    w3cContact.revision = (gcal_contact_get_updated(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_updated(gContact)));

    w3cContact.birthday = (gcal_contact_get_birthday(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_birthday(gContact)));

//    w3cContact.gender; //NOT MAPPED
    w3cContact.note = (gcal_contact_get_content(gContact) == NULL ? std::string("") : std::string(gcal_contact_get_content(gContact)));

    w3cContact.photos = parsePhotos(gContact);

//    w3cContact.categories; //NOT MAPPED
    w3cContact.urls = parseUrls(gContact);
//    w3cContact.timezone; //NOT MAPPED

}

std::map<std::string, std::string> GCalAddressBook::parseStructuredName(gcal_structured_subvalues_t gsc)
{
    std::map < std::string, std::string > name;
    std::stringstream ss;

    while (gsc->next_field != NULL)
    {
        if (gsc->field_key)
        {
            if (gsc->field_key == std::string("fullName"))
                name["formatted"] = gsc->field_value;
            if (gsc->field_key == std::string("familyName"))
                name["familyName"] = gsc->field_value;
            if (gsc->field_key == std::string("givenName"))
                name["givenName"] = gsc->field_value;
            if (gsc->field_key == std::string("additionalName"))
                name["middleName"] = gsc->field_value;
            if (gsc->field_key == std::string("namePrefix"))
                name["honorificPrefix"] = gsc->field_value;
            if (gsc->field_key == std::string("nameSuffix"))
                name["honorificSuffix"] = gsc->field_value;
        }

        gsc = gsc->next_field;
    }
    return name;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parsePhoneNumber(gcal_contact_t gContact)
{

    int num_of_pn = gcal_contact_get_phone_numbers_count(gContact);
    std::vector < std::map<std::string, std::string> > phoneNumbers(num_of_pn);

    for (int i = 0; i < num_of_pn; i++)
    {
        phoneNumbers.at(i)["pref"] = (i == 0 ? "true" : "false");
        phoneNumbers.at(i)["value"] = gcal_contact_get_phone_number(gContact, i);

        std::string type = "";
        switch (gcal_contact_get_phone_number_type(gContact, i))
        {
        case P_ASSISTANT:
            type = "assistant";
            break;
        case P_CALLBACK:
            type = "callback";
            break;
        case P_CAR:
            type = "car";
            break;
        case P_COMPANY_MAIN:
            type = "company";
            break;
        case P_FAX:
            type = "fax";
            break;
        case P_HOME:
            type = "home";
            break;
        case P_HOME_FAX:
            type = "home_fax";
            break;
        case P_ISDN:
            type = "isdn";
            break;
        case P_MAIN:
            type = "main";
            break;
        case P_MOBILE:
            type = "mobile";
            break;
        case P_OTHER:
            type = "other";
            break;
        case P_OTHER_FAX:
            type = "other_fax";
            break;
        case P_PAGER:
            type = "pager";
            break;
        case P_RADIO:
            type = "radio";
            break;
        case P_TELEX:
            type = "telex";
            break;
        case P_TTY_TDD:
            type = "tty_tdd";
            break;
        case P_WORK:
            type = "work";
            break;
        case P_WORK_FAX:
            type = "work_fax";
            break;
        case P_WORK_MOBILE:
            type = "work_mobile";
            break;
        case P_WORK_PAGER:
            type = "work_pager";
            break;
        default:
            break;
        }
        phoneNumbers.at(i)["type"] = type;

    }

    return phoneNumbers;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parseEmails(gcal_contact_t gContact)
{
    int num_of_em = gcal_contact_get_emails_count(gContact);
    std::vector < std::map<std::string, std::string> > emails(num_of_em);

    int p = gcal_contact_get_pref_email(gContact); //pref email index
    for (int i = 0; i < num_of_em; i++)
    {
        emails.at(i)["pref"] = (i == p ? "true" : "false");
        emails.at(i)["value"] = gcal_contact_get_email_address(gContact, i);

        std::string type = "";
        switch (gcal_contact_get_email_address_type(gContact, i))
        {
        case E_HOME:
            type = "home";
            break;
        case E_WORK:
            type = "work";
            break;
        case E_OTHER:
            type = "other";
            break;
        default:
            break;
        }
        emails.at(i)["type"] = type;
    }
    return emails;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parseAddresses(gcal_contact_t gContact)
{
    int num_addrs = gcal_contact_get_structured_address_count(gContact);
    std::vector < std::map<std::string, std::string> > addresses(num_addrs);
    int p = gcal_contact_get_pref_structured_address(gContact); //preferred address

    gcal_structured_subvalues_t gsc;
    gsc = gcal_contact_get_structured_address(gContact);
    char*** types = gcal_contact_get_structured_address_type_obj(gContact);

    while (gsc->next_field)
    {
        if (gsc->field_key)
        {
            if (gsc->field_typenr == p)
                addresses.at(gsc->field_typenr)["pref"] = "true";
            else
                addresses.at(gsc->field_typenr)["pref"] = "false";
            if (gsc->field_key == std::string("formattedAddress"))
                addresses.at(gsc->field_typenr)["formatted"] = gsc->field_value;
            if (gsc->field_key == std::string("street"))
                addresses.at(gsc->field_typenr)["streetAddress"] = gsc->field_value;
            addresses.at(gsc->field_typenr)["type"] = types[0][gsc->field_typenr];
            //std::cout << gsc->field_key <<"("<<type<< "): " << gsc->field_value << "; - " <<gsc->field_typenr<<","<<type.empty()<< std::endl;
        }
        gsc = gsc->next_field;
    }

    return addresses;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parseIms(gcal_contact_t gContact)
{
    int num_of_im = gcal_contact_get_im_count(gContact);
    std::vector < std::map<std::string, std::string> > ims(num_of_im);

    int p = gcal_contact_get_pref_im(gContact); //pref im index
    for (int i = 0; i < num_of_im; i++)
    {
        ims.at(i)["pref"] = (i == p ? "true" : "false");
        ims.at(i)["value"] = gcal_contact_get_im_address(gContact, i);
        ims.at(i)["type"] = gcal_contact_get_im_protocol(gContact, i);
    }
    return ims;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parseOrganizations(gcal_contact_t gContact)
{
    //GCal only allows one organization, therefore it is always preferred
    std::vector < std::map<std::string, std::string> > organizations;
    if (gcal_contact_get_organization(gContact) != NULL)
        if (!std::string(gcal_contact_get_organization(gContact)).empty())
        {
            organizations = std::vector < std::map<std::string, std::string> > (1);
            organizations.at(0)["pref"] = "true";
            organizations.at(0)["type"] = (gcal_contact_get_profission(gContact) == NULL ? "" : gcal_contact_get_profission(gContact));
            organizations.at(0)["name"] = gcal_contact_get_organization(gContact); //has to be non-empty
            organizations.at(0)["department"] = "";
            organizations.at(0)["title"] = (gcal_contact_get_occupation(gContact) == NULL ? "" : gcal_contact_get_occupation(gContact));
        }
    return organizations;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parseUrls(gcal_contact_t gContact)
{
    std::vector < std::map<std::string, std::string> > urls;
    if (gcal_contact_get_homepage(gContact) != NULL)
        if (!std::string(gcal_contact_get_homepage(gContact)).empty())
        {
            std::map < std::string, std::string > tmp = std::map<std::string, std::string>();
            //GCal only allows homepage and blog - we set the first for being preferred
            tmp["pref"] = "true";
            tmp["type"] = "homepage";
            tmp["value"] = (gcal_contact_get_homepage(gContact) == NULL ? "" : gcal_contact_get_homepage(gContact));
            urls.push_back(tmp);
        }
    if (gcal_contact_get_blog(gContact) != NULL)
        if (!std::string(gcal_contact_get_blog(gContact)).empty())
        {
            std::map < std::string, std::string > tmp = std::map<std::string, std::string>();
            //GCal only allows homepage and blog - we set the first for being preferred
            tmp["pref"] = urls.size() == 0 ? "true" : "false";
            tmp["type"] = "blog";
            tmp["value"] = (gcal_contact_get_blog(gContact) == NULL ? "" : gcal_contact_get_blog(gContact));
            urls.push_back(tmp);
        }
    return urls;
}

std::string base64Encode(std::vector<unsigned char> inputBuffer)
{
    std::string encodedString;
    encodedString.reserve(((inputBuffer.size() / 3) + (inputBuffer.size() % 3 > 0)) * 4);
    long temp;
    std::vector<unsigned char>::iterator cursor = inputBuffer.begin();
    for (size_t idx = 0; idx < inputBuffer.size() / 3; idx++)
    {
        temp = (*cursor++) << 16; //Convert to big endian
        temp += (*cursor++) << 8;
        temp += (*cursor++);
        encodedString.append(1, encodeLookup[(temp & 0x00FC0000) >> 18]);
        encodedString.append(1, encodeLookup[(temp & 0x0003F000) >> 12]);
        encodedString.append(1, encodeLookup[(temp & 0x00000FC0) >> 6]);
        encodedString.append(1, encodeLookup[(temp & 0x0000003F)]);
    }
    switch (inputBuffer.size() % 3)
    {
    case 1:
        temp = (*cursor++) << 16; //Convert to big endian
        encodedString.append(1, encodeLookup[(temp & 0x00FC0000) >> 18]);
        encodedString.append(1, encodeLookup[(temp & 0x0003F000) >> 12]);
        encodedString.append(2, padCharacter);
        break;
    case 2:
        temp = (*cursor++) << 16; //Convert to big endian
        temp += (*cursor++) << 8;
        encodedString.append(1, encodeLookup[(temp & 0x00FC0000) >> 18]);
        encodedString.append(1, encodeLookup[(temp & 0x0003F000) >> 12]);
        encodedString.append(1, encodeLookup[(temp & 0x00000FC0) >> 6]);
        encodedString.append(1, padCharacter);
        break;
    }
    return encodedString;
}

std::vector<std::map<std::string, std::string> > GCalAddressBook::parsePhotos(gcal_contact_t gContact)
{
    char * pPhoto = gcal_contact_get_photo(gContact);
    unsigned int photoLen = gcal_contact_get_photolength(gContact);
    std::vector < std::map<std::string, std::string> > photos;
    //TODO handle this
    //    switch (photoLen)
    //    {
    //    case 0:
    //         w3cContact.photos = "NO PHOTO";
    //        break;
    //    case 1:
    //         w3cContact.photos = "LINK" //get link;
    //        break;
    //    case -1:
    //         w3cContact.photos = "ERROR";
    //        break;
    //    default:
    //         w3cContact.photos = base64Encode(...);
    //        break;
    //    }

    if (photoLen > 0)
    {
        photos = std::vector < std::map<std::string, std::string> > (1);
        photos.at(0)["pref"] = "true";
        photos.at(0)["type"] = "file"; //or URL, but it never happens
        photos.at(0)["value"] = base64Encode(std::vector<unsigned char>(pPhoto, pPhoto + photoLen / sizeof(unsigned char)));
    }

    return photos;
}
