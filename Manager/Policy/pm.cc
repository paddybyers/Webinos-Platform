
#include <v8.h>
#include <node.h>

#include "core/policymanager/PolicyManager.h"
#include "debug.h"

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
		NODE_SET_PROTOTYPE_METHOD(s_ct, "reloadPolicy", ReloadPolicy);
		target->Set(String::NewSymbol("PolicyManagerInt"),
		s_ct->GetFunction());
	}

	PolicyManagerInt() :    m_count(0)  {
	}
	
	~PolicyManagerInt()  {  }

	static Handle<Value> New(const Arguments& args)  {
		HandleScope scope;
		PolicyManagerInt* pmtmp = new PolicyManagerInt();
		pmtmp->pminst = new PolicyManager("./policy.xml");
		pmtmp->Wrap(args.This());
		return args.This();
	}

	static Handle<Value> EnforceRequest(const Arguments& args)  {
		HandleScope scope;

		if (args.Length() < 1) {
			return ThrowException(Exception::TypeError(String::New("Argument missing")));
		}

		if (!args[0]->IsObject()) {
			return ThrowException(Exception::TypeError(String::New("Bad type argument")));
		}
		
		PolicyManagerInt* pmtmp = ObjectWrap::Unwrap<PolicyManagerInt>(args.This());
		pmtmp->m_count++;

		map<string, vector<string>*> * subject_attrs = new map<string, vector<string>*>();
		(*subject_attrs)["user-id"] = new vector<string>();
		(*subject_attrs)["user-key-cn"] = new vector<string>();
		(*subject_attrs)["distributor-key-root-fingerprint"] = new vector<string>();

		map<string, vector<string>*> * resource_attrs = new map<string, vector<string>*>();
		(*resource_attrs)["api-feature"] = new vector<string>();
		(*resource_attrs)["device-cap"] = new vector<string>();

		if (args[0]->ToObject()->Has(String::New("resourceInfo"))) {
			v8::Local<Value> riTmp = args[0]->ToObject()->Get(String::New("resourceInfo"));
			if (riTmp->ToObject()->Has(String::New("deviceCap"))) {
				v8::String::AsciiValue deviceCap(riTmp->ToObject()->Get(String::New("deviceCap")));
				(*resource_attrs)["device-cap"]->push_back(*deviceCap);
				LOGD("Parameter device-cap : %s", *deviceCap);
			}
			if (riTmp->ToObject()->Has(String::New("apiFeature"))) {
				v8::String::AsciiValue apiFeature(riTmp->ToObject()->Get(String::New("apiFeature")));
				(*resource_attrs)["api-feature"]->push_back(*apiFeature);
				LOGD("Parameter api-feature : %s", *apiFeature);
			}
		}
		
		if (args[0]->ToObject()->Has(String::New("subjectInfo"))) {
			v8::Local<Value> siTmp = args[0]->ToObject()->Get(String::New("subjectInfo"));
			if (siTmp->ToObject()->Has(String::New("userId"))) {
				v8::String::AsciiValue userId(siTmp->ToObject()->Get(String::New("userId")));
				(*subject_attrs)["user-id"]->push_back(*userId);
				LOGD("Parameter user-id : %s", *userId);
			}
			if (siTmp->ToObject()->Has(String::New("userKeyCn"))) {
				v8::String::AsciiValue userKeyCn(siTmp->ToObject()->Get(String::New("userKeyCn")));
				(*subject_attrs)["user-key-cn"]->push_back(*userKeyCn);
				LOGD("Parameter user-key-cn : %s", *userKeyCn);
			}
		}

		if (args[0]->ToObject()->Has(String::New("widgetInfo"))) {
			v8::Local<Value> siTmp = args[0]->ToObject()->Get(String::New("widgetInfo"));
			if (siTmp->ToObject()->Has(String::New("distributorKeyRootFingerprint"))) {
				v8::String::AsciiValue distributorKeyRootFingerprint(siTmp->ToObject()->Get(String::New("distributorKeyRootFingerprint")));
				(*subject_attrs)["distributor-key-root-fingerprint"]->push_back(*distributorKeyRootFingerprint);
				LOGD("Parameter distributor-key-root-fingerprint : %s", *distributorKeyRootFingerprint);
			}
		}

//		string widPath(".");

//		string roam("N");
//		map<string,string>* environment = new map<string,string>();
//		(*environment)["roaming"] = roam;
		
//		Request* myReq = new Request(widPath, *resource_attrs, *environment);
		Request* myReq = new Request(*subject_attrs, *resource_attrs);
		
		Effect myEff = pmtmp->pminst->checkRequest(myReq);

		//enum Effect {PERMIT, DENY, PROMPT_ONESHOT, PROMPT_SESSION, PROMPT_BLANKET, UNDETERMINED, INAPPLICABLE};

		Local<Integer> result = Integer::New(myEff);
		
		return scope.Close(result);
	}

	
	
	
	static Handle<Value> ReloadPolicy(const Arguments& args)  {
		HandleScope scope;

		PolicyManagerInt* pmtmp = ObjectWrap::Unwrap<PolicyManagerInt>(args.This());

		//TODO: Reload policy file
		delete pmtmp->pminst;
		pmtmp->pminst = new PolicyManager("./policy.xml");

		Local<Integer> result = Integer::New(0);
		
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

