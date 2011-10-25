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
#include <gAddressBook.h>



int main( int argc, char ** argv )
{
  const std::string def_username="<username>";
  const std::string def_password="<password>";

  GCalAddressBook gAB;
  bool result=true;
  if(argc<3)
    result=gAB.authenticate(def_username,def_password);
  else
    result=gAB.authenticate(std::string(argv[1]),std::string(argv[2]));


  if(!result)
    std::cerr<<"Problem logging ininto Google: check program arguments and internet connection"<<std::endl;
  else
    std::cout<<"Logged in correctly"<<std::endl;

  //get and print contacts
  W3CContacts vcts=gAB.getContacts();
  std::cout<<"Found "<<vcts.size()<<" contacts:"<<std::endl;
  for(int i=0; i<vcts.size();i++)
    std::cout<<vcts.at(i)<<std::endl;



  return 0;
}
