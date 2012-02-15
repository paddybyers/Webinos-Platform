package org.webinos.api.widgetmanager;

import org.meshpoint.anode.idl.Dictionary;

public class WidgetConfig implements Dictionary {

	public static final int STATUS_TRANSIENT_ERROR  =  -4;
	public static final int STATUS_IO_ERROR         =  -3;
	public static final int STATUS_CAPABILITY_ERROR =  -2;
	public static final int STATUS_INTERNAL_ERROR   =  -1;
	public static final int STATUS_OK               =   0;
	public static final int STATUS_INVALID          =   1;
	public static final int STATUS_DENIED           =   2;
	public static final int STATUS_REVOKED          =   3;
	public static final int STATUS_UNSIGNED         = 100;
	public static final int STATUS_VALID            = 101;
	
	public Author author;
	public String prefIcon;
	public String[] icons;
	public Document startFile;
	public LocalisableString description;
	public int height;
	public int width;
	public String id;
	public License license;
	public LocalisableString name;
	public LocalisableString shortName;
	public VersionString version;
	public String defaultLocale;
	public String installId;
	public Origin origin;
	public FeatureRequest[] features;
	public AccessRequest[] accessRequests;
	public Preference[] preferences;
}
