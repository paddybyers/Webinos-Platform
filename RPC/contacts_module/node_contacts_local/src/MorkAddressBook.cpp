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

#include "MorkAddressBook.h"

void MorkAddressBook::fromRawAbe( RawAbeMap &rawAbe, std::string &retText, const char *paramTitle )
{
  RawAbeMap::iterator iter;
  iter = rawAbe.find( paramTitle );

  if ( iter != rawAbe.end() )
  {
    retText = std::string( iter->second.c_str() );		
  }
}


void MorkAddressBook::addEntry( RawAbeMap &rawAbe, ABEntry &abe )
{
  fromRawAbe( rawAbe, abe.first_name, constFirstName );
  fromRawAbe( rawAbe, abe.last_name, constLastName );
  fromRawAbe( rawAbe, abe.nick_name, constNickName );
  fromRawAbe( rawAbe, abe.email, constPrimaryEmail );

  fromRawAbe( rawAbe, abe.fax, constFaxNumber );
  fromRawAbe( rawAbe, abe.mobile_tel, constCellularNumber );
  fromRawAbe( rawAbe, abe.home_tel, constHomePhone );
  fromRawAbe( rawAbe, abe.work_tel, constWorkPhone );
  fromRawAbe( rawAbe, abe.notes, constNotes );

  fromRawAbe( rawAbe, abe.web_page, constWebPage1 );

  // Build addresses
  std::string HomeAddress;
  fromRawAbe( rawAbe, HomeAddress, constHomeAddress );
  std::string HomeAddress2;
  fromRawAbe( rawAbe, HomeAddress2, constHomeAddress2 );
  std::string HomeCity;
  fromRawAbe( rawAbe, HomeCity, constHomeCity );
  std::string HomeState;
  fromRawAbe( rawAbe, HomeState, constHomeState );
  std::string HomeZipCode;
  fromRawAbe( rawAbe, HomeZipCode, constHomeZipCode );
  std::string HomeCountry;
  fromRawAbe( rawAbe, HomeCountry, constHomeCountry );

  std::string WorkAddress;
  fromRawAbe( rawAbe, WorkAddress, constWorkAddress );
  std::string WorkAddress2;
  fromRawAbe( rawAbe, WorkAddress2, constWorkAddress2 );
  std::string WorkCity;
  fromRawAbe( rawAbe, WorkCity, constWorkCity );
  std::string WorkState;
  fromRawAbe( rawAbe, WorkState, constWorkState );
  std::string WorkZipCode;
  fromRawAbe( rawAbe, WorkZipCode, constWorkZipCode );
  std::string WorkCountry;
  fromRawAbe( rawAbe, WorkCountry, constWorkCountry );
  std::string JobTitle;
  fromRawAbe( rawAbe, JobTitle, constJobTitle );
  std::string Department;
  fromRawAbe( rawAbe, Department, constDepartment );
  std::string Company;
  fromRawAbe( rawAbe, Company, constCompany );

  std::string address;

  appendAddress( address, HomeAddress );
  if ( !address.empty() ) address += "\r\n";
  appendAddress( address, HomeAddress2 );
  if ( !HomeAddress2.empty() ) address += "\r\n";
  appendAddress( address, HomeCity );
  appendAddress( address, HomeState );
  appendAddress( address, HomeZipCode );
  if ( !HomeCity.empty() || !HomeState.empty() || !HomeZipCode.empty() ) address += "\r\n";
  appendAddress( address, HomeCountry );

  abe.address_home = address;

  address.clear();

  appendAddress( address, JobTitle );
  appendAddress( address, Department );
  if ( !address.empty() ) address += "\r\n";
  appendAddress( address, Company );
  if ( !Company.empty() ) address += "\r\n";
  appendAddress( address, WorkAddress );
  if ( !WorkAddress.empty() ) address += "\r\n";
  appendAddress( address, WorkAddress2 );
  if ( !WorkAddress2.empty() ) address += "\r\n";
  appendAddress( address, WorkCity );
  appendAddress( address, WorkState );
  appendAddress( address, WorkZipCode );
  if ( !WorkCity.empty() || !WorkState.empty() || !WorkZipCode.empty() ) address += "\r\n";
  appendAddress( address, WorkCountry );
  if ( !WorkCountry.empty() ) address += "\r\n";

  abe.address_work = address;
}



///
/// Opens address book 
/// @param path - path to the address book file
/// @return - true if success, otherwise false
///
bool MorkAddressBook::openAddressBook( const std::string& path )
{
  abes_.clear();
  MorkParser mork;

  // Open and parse mork file
  if ( !mork.open( path ) )
  {
    return false;
  }

  const int defaultScope = 0x80;

  MorkTableMap *Tables = 0;
  MorkRowMap *Rows = 0;
  MorkTableMap::iterator tableIter;
  MorkRowMap::iterator rowIter;

  Tables = mork.getTables( defaultScope );

  if ( Tables )
  {
    // Iterate all tables
    for ( tableIter = Tables->begin(); tableIter != Tables->end(); tableIter++ )
    {
      if ( 0 == tableIter->first ) continue;

      // Get rows
      Rows = mork.getRows( defaultScope, &tableIter->second );

      if ( Rows )
      {
        // Iterate all rows
        for ( rowIter = Rows->begin(); rowIter != Rows->end(); rowIter++ )
        {
          if ( 0 == rowIter->first ) continue;

            RawAbeMap ram;
            ABEntry abe;
            std::string column;
            std::string value;

//          char buffer[20];
//          itoa( rowIter->first, buffer, 10 );  //old way of parsing in the original code, but now itoa() is no more supported on g++ 4.5
          //abe.id = std::string( buffer );
          std::stringstream ss;
          ss<<rowIter->first;
          abe.id=ss.str();



          // Get cells
          for ( MorkCells::iterator cellsIter = rowIter->second.begin();
          cellsIter != rowIter->second.end(); cellsIter++ )
          {
            column = mork.getColumn( cellsIter->first );
            value = mork.getValue( cellsIter->second );

            ram[ column ] = value;
          }

          AbeMap::iterator abeIter;

          abes_[ rowIter->first ] = abe;
          abeIter = abes_.find( rowIter->first );

          addEntry( ram, abeIter->second );
        }
      }
    }
  }

  return true;
}

