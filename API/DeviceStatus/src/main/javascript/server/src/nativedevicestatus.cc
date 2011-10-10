#include <cstring>

#include <v8.h>
#include <node.h>

using namespace v8;
using namespace node;

namespace nativedevicestatus_v8 {

Handle<Value> getPropertyValue( const Arguments &args )
{
  HandleScope scope;

  char str[]="foo";

  return String::New(str, strlen(str));
}

}

extern "C"
void init( Handle<Object> target )
{
  HandleScope scope;
  Local<FunctionTemplate> t = FunctionTemplate::New(nativedevicestatus_v8::getPropertyValue);

  target->Set( String::NewSymbol( "getPropertyValue" ), t->GetFunction() );
}
