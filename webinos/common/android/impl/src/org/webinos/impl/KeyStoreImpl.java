package org.webinos.impl;

import org.webinos.api.ErrorCallback;
import org.webinos.api.SuccessCallback;
import org.webinos.api.keystore.KeyStoreManager;
import org.webinos.api.keystore.KeyStoreSuccessCallback;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import android.content.Context;

public class KeyStoreImpl extends KeyStoreManager implements IModule {

	private Context androidContext;

	/*****************************
	 * AuthenticationManager methods
	 *****************************/
	@Override
	public void get(KeyStoreSuccessCallback successCallback,
			ErrorCallback errorCallback, String key) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void delete(SuccessCallback successCallback,
			ErrorCallback errorCallback, String key) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void put(SuccessCallback successCallback,
			ErrorCallback errorCallback, String key, String value) {
		// TODO Auto-generated method stub
		
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
