package org.webinos.wrt.core;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import android.content.ContentResolver;
import android.net.Uri;

public class WidgetConfig {
	
	private String installId;
	private String wgtDir;
	private Properties config;
	private String startUrl;

	public WidgetConfig(ContentResolver resolver, String installId) throws IOException {
		this.installId = installId;
		String installDir = WrtManager.getInstance().getWrtDir() + '/' + installId;
		wgtDir = installDir + "/wgt";
		config = new Properties();
		InputStream is = null;
		try {
			config.load(is = resolver.openInputStream(Uri.parse("content://org.webinos.wrt/" + installId + "/.config")));
		} finally {
			if(is != null) is.close();
		}
		String startFile = config.getProperty("widget.startFile.path");
		startUrl = "content://org.webinos.wrt/" + installId + "/wgt/" + startFile;
	}
	
	public String getInstallId()  { return installId; }
	public String getWidgetDir()  { return wgtDir; }
	public Properties getConfig() { return config; }
	public String getStartUrl()   { return startUrl; }
}
