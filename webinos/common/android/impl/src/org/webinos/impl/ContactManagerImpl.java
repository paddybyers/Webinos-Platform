package org.webinos.impl;

import org.webinos.api.PendingOperation;
import org.webinos.api.contact.ContactErrorCB;
import org.webinos.api.contact.ContactFindCB;
import org.webinos.api.contact.ContactFindOptions;
import org.webinos.api.contact.ContactManager;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;

import android.content.Context;

public class ContactManagerImpl extends ContactManager implements IModule {

	private Context androidContext;

	protected ContactManagerImpl(IDLInterface iface) {
		super(iface);
		// TODO Auto-generated constructor stub
	}

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
	public IValue startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		return null;
	}

	@Override
	public void stopModule() {
		// TODO Auto-generated method stub
		
	}
}
