package org.webinos.api.gallery;

import java.util.Date;

import org.meshpoint.anode.idl.Dictionary;

public class GalleryInfo implements Dictionary {
	public String title;
	public Date createdDate;
	public String location;
	public String[] description;
	public String[] supportedMediaObjectType;
}
