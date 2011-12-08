package org.webinos.api.gallery;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class GalleryManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(GalleryManager.class.getName());
	protected GalleryManager() { super(iface); }

	public static final int AUDIO_TYPE = 0;
	public static final int VIDEO_TYPE = 1;
	public static final int IMAGE_TYPE = 2;
	public static final int SORT_BY_FILENAME = 3;
	public static final int SORT_BY_FILEDATE = 4;
	public static final int SORT_BY_MEDIATYPE = 5;
	public static final int SORT_BY_TITLE = 6;
	public static final int SORT_BY_AUTHOR = 7;
	public static final int SORT_BY_ALBUM = 8;
	public static final int SORT_BY_DATE = 9;
	public static final int SORT_BY_ASCENDING = 10;
	public static final int SORT_BY_DESCENDING = 11;

	public int length;

	public abstract PendingOperation find (String[] fields, GalleryFindCB successCB, GalleryErrorCB errorCB, GalleryFindOptions options);
	public abstract PendingOperation getGalleries (GalleryInfoCB successCB, GalleryErrorCB errorCB);
}
