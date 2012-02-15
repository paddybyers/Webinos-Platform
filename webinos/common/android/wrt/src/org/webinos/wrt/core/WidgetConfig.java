package org.webinos.wrt.core;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class WidgetConfig {
	
	private String installId;
	private String wgtDir;
	private Properties config;
	private String startUrl;

	public WidgetConfig(String installId) throws IOException {
		this.installId = installId;
		String installDir = WrtManager.getInstance().getWrtDir() + '/' + installId;
		wgtDir = installDir + "/wgt";
		config = new Properties();
		FileInputStream fis = null;
		try {
			config.load(fis = new FileInputStream(installDir + "/.config"));
		} finally {
			if(fis != null) fis.close();
		}
		String startFile = config.getProperty("widget.startFile.path");
		startUrl = "file://" + wgtDir + '/' + startFile;
	}
	
	public String getInstallId()  { return installId; }
	public String getWidgetDir()  { return wgtDir; }
	public Properties getConfig() { return config; }
	public String getStartUrl()   { return startUrl; }
}
