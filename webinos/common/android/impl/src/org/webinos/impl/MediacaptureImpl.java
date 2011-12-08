package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;
import org.webinos.api.PendingOperation;
import org.webinos.api.mediacapture.CaptureCB;
import org.webinos.api.mediacapture.CaptureErrorCB;
import org.webinos.api.mediacapture.CaptureMediaOptions;
import org.webinos.api.mediacapture.CaptureVideoOptions;
import org.webinos.api.mediacapture.MediacaptureManager;

import android.content.Context;

public class MediacaptureImpl extends MediacaptureManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * MediacaptureManager methods
	 *****************************/
	@Override
	public PendingOperation captureImage(CaptureCB successCB,
			CaptureErrorCB errorCB, CaptureMediaOptions options) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation captureVideo(CaptureCB successCB,
			CaptureErrorCB errorCB, CaptureVideoOptions options) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation captureAudio(CaptureCB successCB,
			CaptureErrorCB errorCB, CaptureMediaOptions options) {
		// TODO Auto-generated method stub
		return null;
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public IValue startModule(IModuleContext ctx) {
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
