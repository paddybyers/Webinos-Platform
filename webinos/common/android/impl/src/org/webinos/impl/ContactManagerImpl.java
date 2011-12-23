package org.webinos.impl;

import org.webinos.api.PendingOperation;
import org.webinos.api.contact.Contact;
import org.webinos.api.contact.ContactErrorCB;
import org.webinos.api.contact.ContactFindCB;
import org.webinos.api.contact.ContactFindOptions;
import org.webinos.api.contact.ContactManager;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import android.content.Context;
import android.os.Looper;
import android.widget.Toast;

import android.database.Cursor;


public class ContactManagerImpl extends ContactManager implements IModule {

	private Context androidContext;

	/*****************************
	 * ContactManager methods
	 *****************************/
	@Override
	public PendingOperation find(String[] fields, ContactFindCB successCB, ContactErrorCB errorCB, ContactFindOptions options) {
		// TODO Auto-generated method stub
        //Log.v("CONTACTS", "TEST!");
        
		try {
          Toast toast = Toast.makeText(androidContext, fields.toString(), Toast.LENGTH_LONG);
          toast.show();
		}
		catch(Throwable t){
			t.printStackTrace(); 
		}
          
		Contact[] contacts = this.getContacts();
		successCB.onSuccess(contacts);
	
		return null;
	}
	
	
	private int getContactsNumber() {
		return 2;
	}
	
	private Contact[] getContacts(){
		
		Contact[] contacts = new Contact[this.getContactsNumber()];
		
		contacts[0] = new ContactImpl(this);		
		contacts[0].displayName = "NAME";
		
		return contacts;
	}
	

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		/*
		 * perform any module initialisation here ...
		 */
		
		Looper.prepare();

		return this;
	}

	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
	}
}
