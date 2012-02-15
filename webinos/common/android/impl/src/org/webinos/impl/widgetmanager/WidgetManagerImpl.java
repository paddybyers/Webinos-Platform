package org.webinos.impl.widgetmanager;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.widgetmanager.Constraints;
import org.webinos.api.widgetmanager.PrepareListener;
import org.webinos.api.widgetmanager.ProcessingResult;
import org.webinos.api.widgetmanager.WidgetConfig;
import org.webinos.api.widgetmanager.WidgetManager;
import org.webinos.api.widgetmanager.WidgetProcessor;

import android.content.Context;

public class WidgetManagerImpl extends WidgetManager implements IModule, WidgetProcessor {
	
	private WidgetProcessor processor;
	private Context androidContext;
	
	/*****************************
	 * WidgetManager methods
	 *****************************/

	@Override
	public void setWidgetProcessor(WidgetProcessor processor) {
		this.processor = processor;
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		return this;
	}

	@Override
	public void stopModule() {
		processor = null;
	}

	/*****************************
	 * WidgetProcessor methods
	 *****************************/
	
	private class PrepareListenerImpl extends PrepareListener {

		@Override
		public void onPrepareComplete(ProcessingResult processingResult) {
			// TODO Auto-generated method stub
			
		}
	}

	@Override
	public String[] getInstalledWidgets() {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		return processor.getInstalledWidgets();
	}

	@Override
	public WidgetConfig getWidgetConfig(String installId) {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		return processor.getWidgetConfig(installId);
	}

	@Override
	public void prepareInstall(String widgetResource, Constraints constraints,
			PrepareListener listener) {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		processor.prepareInstall(widgetResource, constraints, listener);
	}

	@Override
	public void completeInstall(String installId) {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		processor.completeInstall(installId);
	}

	@Override
	public void abortInstall(String installId) {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		processor.abortInstall(installId);
	}

	@Override
	public void uninstall(String installId) {
		if(processor == null)
			throw new RuntimeException("WidgetManager: native widget processor not available");
		processor.uninstall(installId);
	}
}
