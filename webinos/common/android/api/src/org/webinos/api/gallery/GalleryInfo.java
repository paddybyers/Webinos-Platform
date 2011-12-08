package org.webinos.api.gallery;

import java.util.Date;

import org.meshpoint.anode.idl.ValueType;

public class GalleryInfo implements ValueType {
	public String title;
	public Date createdDate;
	public String location;
	public String[] description;
	public String[] supportedMediaObjectType;
}
