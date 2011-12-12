package org.webinos.api.gallery;

import java.util.Date;

import org.meshpoint.anode.idl.Dictionary;

public class GalleryFindOptions implements Dictionary {
	public String filter;
	public Integer mediaType;
	public GalleryInfo[] gallery;
	public Integer order;
	public Integer firstSortOption;
	public Integer secondSortOption;
	public Date startDate;
	public Date endDate;
}
