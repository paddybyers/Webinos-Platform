package org.webinos.impl.nfc;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.nfc.NfcEventListener;
import org.webinos.api.nfc.NfcManager;

import android.content.Context;

public class NfcImpl extends NfcManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * NfcManager methods
	 *****************************/
	@Override
	public void addEventListener(String type, NfcEventListener listener,
			boolean useCapture) {
		// TODO Auto-generated method stub

	}

	@Override
	public void removeEventListener(String type, NfcEventListener listener,
			boolean useCapture) {
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
