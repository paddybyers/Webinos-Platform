package org.webinos.impl;

import java.util.ArrayList;
import java.util.Date;

import org.webinos.api.PendingOperation;
import org.webinos.api.contact.Contact;
import org.webinos.api.contact.ContactAddress;
import org.webinos.api.contact.ContactErrorCB;
import org.webinos.api.contact.ContactField;
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
import android.provider.ContactsContract.PhoneLookup;
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
    		contact.phoneNumbers = getConcactPhoneNumbers(cursor, contactID);
    		contact.emails = getContactEmails(cursor, contactID);
    		contact.addresses = getContactAddresses(cursor, contactID);
    		
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
	
	private ContactField[] getConcactPhoneNumbers(Cursor cursor, String contactID) {
		
		ArrayList<ContactField> phoneNumbers = new ArrayList<ContactField>();
		
		if(cursor.getColumnIndex(PhoneLookup.HAS_PHONE_NUMBER) != 0){
			Cursor phones_cursor = androidContext.getContentResolver().query( ContactsContract.CommonDataKinds.Phone.CONTENT_URI, 
																				null, 
																				ContactsContract.CommonDataKinds.Phone.CONTACT_ID +" = "+ contactID, 
																				null, null); 
				while(phones_cursor.moveToNext()) {
					
					ContactField tmp = new ContactField();

					if(phones_cursor.getString(phones_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.IS_PRIMARY)).compareTo("0") != 0) {
						tmp.pref = true;
					}
					
					String type = phones_cursor.getString(phones_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE));
					
					switch (Integer.parseInt(type)) {
						case ContactsContract.CommonDataKinds.Phone.TYPE_ASSISTANT :
							tmp.type = "ASSISTANT";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_CALLBACK :
							tmp.type = "CALLBACK";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_CAR :
							tmp.type = "CAR";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_COMPANY_MAIN :
							tmp.type = "CAMPANY_MAIN";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_FAX_HOME :
							tmp.type = "FAX_HOME";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_FAX_WORK :
							tmp.type = "FAX_WORK";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_HOME :
							tmp.type = "HOME";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_ISDN :
							tmp.type = "ISDN";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_MAIN :
							tmp.type = "MAIN";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_MMS :
							tmp.type = "MMS";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE	:
							tmp.type = "MOBILE";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_OTHER :
							tmp.type = "OTHER";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_OTHER_FAX :
							tmp.type = "OTHER_FAX";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_PAGER :
							tmp.type = "PAGER";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_RADIO :
							tmp.type = "RADIO";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_TELEX :
							tmp.type = "TELEX";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_TTY_TDD :
							tmp.type = "TTY_TDD";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_WORK :
							tmp.type = "WORK";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_WORK_MOBILE :
							tmp.type = "WORK_MOBILE";
						break;
						case ContactsContract.CommonDataKinds.Phone.TYPE_WORK_PAGER :
							tmp.type = "WORK_PAGER";
						break;
						default:
							tmp.value = "UNKNOWN";
						break;
					}
					tmp.value = phones_cursor.getString(phones_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER));
					phoneNumbers.add(tmp);
				}
			phones_cursor.close();
			return phoneNumbers.toArray(new ContactField[0]);
		}		
		
		return null;
	}
	
	private ContactField[] getContactEmails(Cursor cursor, String contactID) {
		
		ArrayList<ContactField> emails = new ArrayList<ContactField>();
		
		Cursor emails_cursor = androidContext.getContentResolver().query(	ContactsContract.CommonDataKinds.Email.CONTENT_URI, 
																			null, 
																			ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = " + contactID, 
																			null, null); 
		while (emails_cursor.moveToNext()) {
			
			ContactField tmp = new ContactField();
			
			//TODO: preferred needs to be checked
			if(emails_cursor.getString(emails_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.IS_PRIMARY)).compareTo("0") != 0)
				tmp.pref = true;
			
			//TODO: type needs to be checked
			String type = emails_cursor.getString(emails_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA2));
			
			switch(Integer.parseInt(type)) {
				case ContactsContract.CommonDataKinds.Email.TYPE_HOME:
					tmp.value = "HOME";
				break;
				case ContactsContract.CommonDataKinds.Email.TYPE_MOBILE:
					tmp.value = "MOBILE";
				break;
				case ContactsContract.CommonDataKinds.Email.TYPE_OTHER:
					tmp.value = "OTHER";
				break;
				case ContactsContract.CommonDataKinds.Email.TYPE_WORK:
					tmp.value = "WORK";
				break;
				case ContactsContract.CommonDataKinds.Email.TYPE_CUSTOM:
					tmp.value = "CUSTOM";
				break;
				default:
					tmp.value = "UNKNOWN";
				break;
			}

			tmp.value = emails_cursor.getString(emails_cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA1));
			emails.add(tmp);
		}
		emails_cursor.close();
		
		return emails.toArray(new ContactField[0]);
	}

	private ContactAddress[] getContactAddresses(Cursor cursor, String contactID) {
		
		ArrayList<ContactAddress> addresses = new ArrayList<ContactAddress>();
		
		Cursor addresses_cursor = androidContext.getContentResolver().query(	ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_URI,
												                null,
												                ContactsContract.CommonDataKinds.StructuredPostal.CONTACT_ID + " = " + contactID,
												                null, null);
		while (addresses_cursor.moveToNext()) { 
			
			String tmp = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.STREET));
			tmp += addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.CITY));
			tmp += addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.REGION));
			tmp += addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE));
			tmp += addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY));
			
			ContactAddress address = new ContactAddress();
			
			if(addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.IS_PRIMARY)).compareTo("0") != 0)
				address.pref = true;
			
			address.country = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY));
			address.formatted = tmp;
			address.locality = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.CITY));
			address.postalCode = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE));
			address.region = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.REGION));
			address.streetAddress = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.STREET));
			
			String type = addresses_cursor.getString(addresses_cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredPostal.TYPE));
			
			switch(Integer.parseInt(type)) {
				case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME:
					address.type = "HOME";
				break;
				case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER:
					address.type = "OTHER";
				break;
				case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK:
					address.type = "WORK";
				break;
				default:
					address.type = "UNKNOWN";
				break;
			}
			
			addresses.add(address);
		}  
		addresses_cursor.close();
		
		return addresses.toArray(new ContactAddress[0]);
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
