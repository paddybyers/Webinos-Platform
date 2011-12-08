package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;
import org.webinos.api.PendingOperation;
import org.webinos.api.gallery.GalleryErrorCB;
import org.webinos.api.gallery.GalleryFindCB;
import org.webinos.api.gallery.GalleryFindOptions;
import org.webinos.api.gallery.GalleryInfoCB;
import org.webinos.api.gallery.GalleryManager;

import android.content.Context;

public class GalleryImpl extends GalleryManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * GalleryManager methods
	 *****************************/
	@Override
	public PendingOperation find(String[] fields, GalleryFindCB successCB,
			GalleryErrorCB errorCB, GalleryFindOptions options) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation getGalleries(GalleryInfoCB successCB,
			GalleryErrorCB errorCB) {
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
