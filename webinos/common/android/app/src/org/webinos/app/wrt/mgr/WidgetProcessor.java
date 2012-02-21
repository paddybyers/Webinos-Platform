package org.webinos.app.wrt.mgr;

public interface WidgetProcessor {
	public String[] getInstalledWidgets();
	public String getWidgetDir(String installId);
	public WidgetConfig getWidgetConfig(String installId);
	public void prepareInstall(String widgetResource, Constraints constraints, PrepareListener listener);
	public void completeInstall(String installId);
	public void abortInstall(String installId);
	public void uninstall(String installId);
}
