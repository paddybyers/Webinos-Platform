package org.webinos.api.widgetmanager;

public interface WidgetProcessor {
	public String[] getInstalledWidgets();
	public WidgetConfig getWidgetConfig(String installId);
	public void prepareInstall(String widgetResource, Constraints constraints, PrepareListener listener);
	public void completeInstall(String installId);
	public void abortInstall(String installId);
	public void uninstall(String installId);
}
