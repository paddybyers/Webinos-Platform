package org.webinos.impl;

import org.webinos.api.PendingOperation;
import org.webinos.api.contact.ContactErrorCB;
import org.webinos.api.contact.ContactFindCB;
import org.webinos.api.contact.ContactFindOptions;
import org.webinos.api.contact.ContactManager;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import android.content.Context;

public class ContactManagerImpl extends ContactManager implements IModule {

	private Context androidContext;

	/*****************************
	 * ContactManager methods
	 *****************************/
	@Override
	public PendingOperation find(String[] fields, ContactFindCB successCB,
			ContactErrorCB errorCB, ContactFindOptions options) {
		// TODO Auto-generated method stub
		return null;
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
		return this;
	}

	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
	}
}
