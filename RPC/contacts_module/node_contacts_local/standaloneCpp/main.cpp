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

int main( int argc, char ** argv )
{
  //openAddressBook( "D:\\Development\\OpenSource\\MorkParser-STL1.0\\abook.mab" );
  const std::string defaultAB="<path_to_thunderbird_address_book>/abook.mab"; 
  
  MorkAddressBook mab;
  bool result;
  if(argc==1)
    result=mab.openAddressBook(defaultAB);
  else
    result=mab.openAddressBook(std::string(argv[1]));
    
    
  if(!result)
    std::cerr<<"Problem opening addrss book: check program arguments and path"<<std::endl;

  AbeMap::iterator iter;
  AbeMap ab=mab.getAB();
  std::cout<<"Found "<<ab.size()<<" contacts"<<std::endl;
  int i=0;
  for ( iter = ab.begin(); iter != ab.end(); iter++ )
  {
    std::cout << "Entry #"<< ++i<< std::endl;
    std::cout << "Email Address: " << iter->second.email << std::endl;
    std::cout << "Name: " << iter->second.first_name  << " " << iter->second.last_name << std::endl << std::endl;
  }
  return 0;
}
