package org.webinos.impl;

import java.util.ArrayList;
import java.util.Date;

import org.webinos.api.PendingOperation;
import org.webinos.api.contact.Contact;
import org.webinos.api.contact.ContactErrorCB;
import org.webinos.api.contact.ContactFindCB;
import org.webinos.api.contact.ContactFindOptions;
import org.webinos.api.contact.ContactManager;
import org.webinos.api.contact.ContactName;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import android.content.ContentResolver;
import android.content.Context;
import android.os.Looper;
import android.provider.ContactsContract;
import android.widget.Toast;

import android.database.Cursor;


@SuppressWarnings("unused") //TODO: to be removed...
public class ContactManagerImpl extends ContactManager implements IModule {

	private Context androidContext;
	private ContentResolver contentResolver;

	/*****************************
	 * ContactManager methods
	 *****************************/
	@Override
	public PendingOperation find(String[] fields, ContactFindCB successCB, ContactErrorCB errorCB, ContactFindOptions options) {
		// TODO Auto-generated method stub
        //Log.v("CONTACTS", "TEST!");
        
		/*try {
          Toast toast = Toast.makeText(androidContext, fields.toString(), Toast.LENGTH_LONG);
          toast.show();
		}
		catch(Throwable t){
			t.printStackTrace(); 
		}*/
          
		Contact[] contacts = this.getContacts();	
		successCB.onSuccess(contacts);
	
		return null;
	}
	
	
	private int getContactsNumber() {
		
		Cursor cursor = androidContext.getContentResolver().query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
		int i;
		
		for(i = 0; cursor.moveToNext(); i++);
		
		return i;
	}
	
	
	private Contact[] getContacts(){
				
		ArrayList<Contact> contacts = new ArrayList<Contact>();	
		Cursor cursor = androidContext.getContentResolver().query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
		
    	int i = 0;
    	while(cursor.moveToNext()) {
    		
    		ContactImpl contact =  new ContactImpl(this);
    		
    		String contactID = getContactID(cursor);
    		
    		contact.id = contactID;
    		contact.displayName = getContactDisplayName(cursor);
    		contact.name = getContactName(cursor, contactID);
    		contact.revision = getContactRevision(cursor, contactID);
    		contact.nickname = getContactNickname(cursor, contactID);
    		
    		
    		contacts.add(contact);   		
    		//contacts[i] = contact;
    		i++;
    	}
		
		/*Contact[] contacts = new Contact[this.getContactsNumber()];
		ContactImpl contact =  new ContactImpl(this);
    	contact.displayName = "---NAME---";
    	contacts[0] = contact;
    	return contacts*/
    		
		return contacts.toArray(new Contact[0]);
	}
	
	private String getContactID(Cursor cursor) {
		return cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts._ID));
	}
	
	private String getContactDisplayName(Cursor cursor) {
		return cursor.getString(cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME));
	}
	
	private ContactName getContactName(Cursor cursor, String contactID){
		
		ContactName contact = new ContactName();		
		Cursor name_cursor = androidContext.getContentResolver().query( ContactsContract.Data.CONTENT_URI, 
																		null, 
																		ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?", 
																		new String[]{contactID, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}, 
																		null);
		
		if(name_cursor.moveToFirst()) {
			contact.familyName = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME));
			contact.givenName = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME));
			contact.middleName = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.MIDDLE_NAME));
			contact.honorificPrefix = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.PREFIX));
			contact.honorificSuffix = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.SUFFIX));
			contact.formatted = contact.honorificPrefix + 
								contact.givenName +
								contact.middleName +
								contact.familyName +
								contact.honorificSuffix;
			}  
		name_cursor.close();
		
		return contact;
	}
	
	private Date getContactRevision(Cursor cursor, String contactID) { //TODO: to be checked and converted from milliseconds to Date()
		
		String tmp;
		Cursor name_cursor = androidContext.getContentResolver().query( ContactsContract.Data.CONTENT_URI, 
																		null, 
																		ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?", 
																		new String[]{contactID, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}, 
																		null);
		if(name_cursor.moveToFirst())
			tmp = name_cursor.getString(name_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.CONTACT_STATUS_TIMESTAMP));
		
		Date date = new Date();
		
		return null;
	}
	
	private String getContactNickname(Cursor cursor, String contactID) {
		
		String nickName = null;
		Cursor nickName_cursor = androidContext.getContentResolver().query( ContactsContract.Data.CONTENT_URI, 
																			null, 
																			ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?", 
																			new String[]{contactID, ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE}, 
																			null);
		if (nickName_cursor.moveToFirst())
			nickName = nickName_cursor.getString(nickName_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Note.NOTE));
		
		nickName_cursor.close();
		
		return nickName;
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
		contentResolver = androidContext.getContentResolver();
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
