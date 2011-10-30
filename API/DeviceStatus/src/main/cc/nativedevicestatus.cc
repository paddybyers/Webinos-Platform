#include <cstring>
#include <string>
#include <v8.h>
#include <node.h>
#include "battery.h"

using namespace v8;
using namespace node;

namespace nativedevicestatus_v8 {

Handle<Value> getPropertyValue( const Arguments &args )
{
  HandleScope scope;
  std::string res = batteryLevel();
  return String::New(res.c_str(), res.length());
  //return batteryLevel();
}

}

extern "C"
void init( Handle<Object> target )
{
  HandleScope scope;
  Local<FunctionTemplate> t = FunctionTemplate::New(nativedevicestatus_v8::getPropertyValue);

  target->Set( String::NewSymbol( "getPropertyValue" ), t->GetFunction() );
}
