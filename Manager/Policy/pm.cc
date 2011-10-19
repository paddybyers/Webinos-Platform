
#include <v8.h>
#include <node.h>

#include "core/policymanager/PolicyManager.h"

using namespace node;
using namespace v8;

class PolicyManagerInt: ObjectWrap{

private:  
	int m_count;
	
public:
	PolicyManager* pminst;
	static Persistent<FunctionTemplate> s_ct;
  
	static void Init(Handle<Object> target)  {
		HandleScope scope;
		Local<FunctionTemplate> t = FunctionTemplate::New(New);
		s_ct = Persistent<FunctionTemplate>::New(t);
		s_ct->InstanceTemplate()->SetInternalFieldCount(1);
		s_ct->SetClassName(String::NewSymbol("PolicyManagerInt"));
		NODE_SET_PROTOTYPE_METHOD(s_ct, "enforceRequest", EnforceRequest);
		target->Set(String::NewSymbol("PolicyManagerInt"),
		s_ct->GetFunction());
	}

	PolicyManagerInt() :    m_count(0)  {
	}
	
	~PolicyManagerInt()  {  }

	static Handle<Value> New(const Arguments& args)  {
		HandleScope scope;
		PolicyManagerInt* pmtmp = new PolicyManagerInt();
		PolicyManager* pminsttmp = new PolicyManager("./policy.xml");
		pmtmp->pminst = pminsttmp;
		pmtmp->Wrap(args.This());
		return args.This();
	}

	static Handle<Value> EnforceRequest(const Arguments& args)  {
		HandleScope scope;

		if (args.Length() < 1) {
			return ThrowException(Exception::TypeError(String::New("Argument missing")));
		}

		if (!args[0]->IsString()) {
			return ThrowException(Exception::TypeError(String::New("Bad type argument")));
		}

		v8::String::AsciiValue recFeature(args[0]);

		PolicyManagerInt* pmtmp = ObjectWrap::Unwrap<PolicyManagerInt>(args.This());
		pmtmp->m_count++;

		string widPath(".");
		
		map<string, vector<string>*> * resource_attrs = new map<string, vector<string>*>();
		(*resource_attrs)["api-feature"] = new vector<string>();
		(*resource_attrs)["device-cap"] = new vector<string>();
		(*resource_attrs)["device-cap"]->push_back(*recFeature);
		
		string roam("N");
		map<string,string>* environment = new map<string,string>();
		(*environment)["roaming"] = roam;
		
		Request* myReq = new Request(widPath, *resource_attrs, *environment);
		
		Effect myEff = pmtmp->pminst->checkRequest(myReq);

		//enum Effect {PERMIT, DENY, PROMPT_ONESHOT, PROMPT_SESSION, PROMPT_BLANKET, UNDETERMINED, INAPPLICABLE};

		Local<Integer> result = Integer::New(myEff);
		
		return scope.Close(result);
	}
};

Persistent<FunctionTemplate> PolicyManagerInt::s_ct;

extern "C" {
	static void init (Handle<Object> target)  {
		PolicyManagerInt::Init(target);  
	}
	NODE_MODULE(pm, init);
} 

