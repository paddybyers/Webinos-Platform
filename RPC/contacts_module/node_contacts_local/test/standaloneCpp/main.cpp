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
#include <iostream>
#include <string>
#include <MorkAddressBook.h>
#include <MorkParser.h>

///
/// Opens address book
/// @param path - path to the address book file
/// @return - true if success, otherwise false
///
RawAbeMap getRawAddressBook( const std::string& path )
{
  //abes_.clear();
  MorkParser mork;

  // Open and parse mork file
  if ( !mork.open( path ) )
  {
    return RawAbeMap();
  }

  const int defaultScope = 0x80;

  RawAbeMap ram;

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

            //RawAbeMap ram;
            //ABEntry abe;
            std::string column;
            std::string value;

//          char buffer[20];
//          itoa( rowIter->first, buffer, 10 );  //old way of parsing in the original code, but now itoa() is no more supported on g++ 4.5
          //abe.id = std::string( buffer );

//          std::stringstream ss;
//          ss<<rowIter->first;
//          abe.id=ss.str();



          // Get cells
          for ( MorkCells::iterator cellsIter = rowIter->second.begin();
          cellsIter != rowIter->second.end(); cellsIter++ )
          {
            column = mork.getColumn( cellsIter->first );
            value = mork.getValue( cellsIter->second );

            ram[ column ] = value;
            std::cout<<"\033[1;31;43m COLUMN:\033[0m "<<column<<"    \033[1;33;41mvalue:\033[0m "<<value<<std::endl;
          }
          std::cout<<std::endl;

          //AbeMap::iterator abeIter;

          //abes_[ rowIter->first ] = abe;
          //abeIter = abes_.find( rowIter->first );

          //addEntry( ram, abeIter->second );
        }
      }
    }
  }

  return ram;
}







int main( int argc, char ** argv )
{
  //openAddressBook( "D:\\Development\\OpenSource\\MorkParser-STL1.0\\abook.mab" );
  const std::string defaultAB="<path_to_thunderbird_address_book>/abook.mab"; 
  
  MorkAddressBook mab;
  bool result;
//  if(argc==1)
//    result=mab.openAddressBook(defaultAB);
//  else
//    result=mab.openAddressBook(std::string(argv[1]));
//
//
//  if(!result)
//    std::cerr<<"Problem opening addrss book: check program arguments and path"<<std::endl;
//
//  AbeMap::iterator iter;
//  AbeMap ab=mab.getAB();
//  std::cout<<"Found "<<ab.size()<<" contacts"<<std::endl;
//  int i=0;
//  for ( iter = ab.begin(); iter != ab.end(); iter++ )
//  {
//    std::cout << "Entry #"<< ++i<< std::endl;
//    std::cout << "Email Address: " << iter->second.email << std::endl;
//    std::cout << "Name: " << iter->second.first_name  << " " << iter->second.last_name << std::endl << std::endl;
//  }

  if (argc>1)
      RawAbeMap rm =getRawAddressBook(std::string(argv[1]));

  return 0;
}
