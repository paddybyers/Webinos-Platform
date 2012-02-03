package org.webinos.impl;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.gallery.GalleryErrorCB;
import org.webinos.api.gallery.GalleryFindCB;
import org.webinos.api.gallery.GalleryFindOptions;
import org.webinos.api.gallery.GalleryInfo;
import org.webinos.api.gallery.GalleryInfoCB;
import org.webinos.api.gallery.GalleryManager;
import org.webinos.api.gallery.GalleryError;
import org.webinos.api.gallery.MediaObject;

import android.content.Context;
import android.util.Log;
import android.media.MediaMetadataRetriever;
import android.media.ExifInterface;
import android.webkit.MimeTypeMap;


public class GalleryImpl extends GalleryManager implements IModule {

	private Context androidContext;
	private boolean searchInProgress;

	private static final String LABEL = "org.webinos.impl.GalleryImpl";

	private	static final String[] gallerySearchPaths = {
		"/sdcard"
	};

	private	static final String[] galleryExcludePaths = {
		"/sdcard/widget"
	};

	//TODO automatically retrieve the supported mimetypes...
	private static final String[] supportedMimetypes = {
		"image/png",
		"image/jpeg",
		"image/gif",
		"audio/mpeg",
		"video/3gpp"
	};
	
	/*****************************
	 * GalleryManager methods
	 *****************************/
	@Override
	public PendingOperation find(String[] fields, GalleryFindCB successCB,
			GalleryErrorCB errorCB, GalleryFindOptions options) {
		Log.v(LABEL, "find");

		GalleryFinder galleryFinder = new GalleryFinder(successCB, errorCB);
		Thread t = new Thread(galleryFinder);
		t.start();

		return new GalleryPendingOperation(t, galleryFinder);
	}

	@Override
	public PendingOperation getGalleries(GalleryInfoCB successCB,
			GalleryErrorCB errorCB) {
		// TODO Auto-generated method stub
		return null;
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		setSearchInProgress(false);
		return this;
	}

	@Override
	public void stopModule() {
	}
	
	private synchronized boolean getSearchInProgress() {
		return searchInProgress;
	}

	private synchronized void setSearchInProgress(boolean val) {
		searchInProgress = val;
	}

	class GalleryFinder implements GalleryRunnable {

		private Env env = Env.getCurrent();
		private GalleryFindCB successCallback;
		private GalleryErrorCB errorCallback;
		private boolean stopped;
		
		private GalleryFinder(GalleryFindCB successCB, GalleryErrorCB errorCB) {
			this.successCallback = successCB;
			this.errorCallback = errorCB;
		}
		
		public synchronized boolean isStopped() {
			return stopped;
		}

		public synchronized void stop() {
			stopped = true;
		}
		
		private boolean searchGallery(int index) {
			return true;
		}
		
		private boolean isMediaFile(File file) {
			String fileName = file.getName();
			if(fileName.lastIndexOf(".")>0) {
				String extension = fileName.substring(fileName.lastIndexOf("."));
				String mimetype = MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(extension));
				for (String supportedMimetype: supportedMimetypes){
					if(supportedMimetype == mimetype) {
						Log.v(LABEL, "File "+fileName+", mimetype "+mimetype);
						return true;
					}
				}
			}
			return false;
		}
		
		private MediaObject getMetadata (File file) {
			MediaObject result = new MediaObject();
			result.id = 0; //TODO implement
			result.gallery = null;	//TODO implement
			result.locator = file.getAbsolutePath();
			
			return result;
		}
		
		private List<MediaObject> searchMediaFiles(File dir, List<MediaObject> inList) {
			Log.v(LABEL, "searchMediaFiles - dir "+dir.getAbsolutePath());
			List<MediaObject> result = inList;
			try {
				File[] dirFiles = dir.listFiles();
				for(String excludeDir: galleryExcludePaths) {
					if(dir.getAbsolutePath().indexOf(excludeDir) != -1) {
						Log.v(LABEL, "EXCLUDE!");
						return result;
					}
				}
				for(int j=0; j<dirFiles.length; j++) {
					//Log.v(LABEL, "searchMediaFiles - found "+dirFiles[j].getAbsolutePath());
					if(!dirFiles[j].isHidden()) {
						if(dirFiles[j].isDirectory()) {
							result = searchMediaFiles(dirFiles[j], result);
						}
						else if(isMediaFile(dirFiles[j])) {
							//Log.v(LABEL, "searchMediaFiles - extracting metadata");
							result.add(getMetadata(dirFiles[j]));
						}
					}
				}
			}
			catch(Exception e) {
				Log.v(LABEL, "searchMediaFiles exception "+e.getMessage());
			}
			
			return result;
		}
		
		public void run() {
			try {
				Log.v(LABEL, "GalleryFinder run");
				Env.setEnv(env);
				boolean busy = false;
				Log.v(LABEL, "GalleryFinder run - 01");
				synchronized(this) {
					busy = getSearchInProgress();
					setSearchInProgress(true);
				}
				Log.v(LABEL, "GalleryFinder run - 02");
				if(busy){
					GalleryError err = new GalleryError();
					err.code = GalleryError.PENDING_OPERATION_ERROR;
					errorCallback.onError(err);
					return;
				}
				Log.v(LABEL, "GalleryFinder run - 03");
				
				//perform search
				List<MediaObject> result = new ArrayList<MediaObject>();
				for(String dirName: gallerySearchPaths) {
					File rootDir = new File(dirName);
					result = searchMediaFiles(rootDir, result);
				}

				Log.v(LABEL, "GalleryFinder run - 06 - "+result.size()+" results found");
				/*
				List<MediaObject> result = new ArrayList<MediaObject>();
				MediaMetadataRetriever retriever = new MediaMetadataRetriever();
				for(int i=0; i<galleryPaths.length; i++) {
					Log.v(LABEL, "GalleryFinder run - 04");
					if(searchGallery(i)) {
						File folder	= new File (galleryPaths[i]);
						File[] dirFiles = folder.listFiles();
						for(int j=0; j<dirFiles.length; j++) {
							//TODO check if this is a media file
							MediaObject tmp = new MediaObject();
							Log.v(LABEL, "GalleryFinder run - 044 - "+dirFiles[j].getAbsolutePath());
							tmp.id = 0; //TODO implement
							tmp.gallery = null;
							tmp.locator = dirFiles[j].getAbsolutePath();
							try {
								retriever.setDataSource(dirFiles[j].getAbsolutePath());
								Log.v(LABEL, "GalleryFinder run - 045");
								Log.v(LABEL, "filename is "+tmp.locator);
								tmp.title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE);
								Log.v(LABEL, "title is "+tmp.title);
	
								tmp.language = null; //TODO implement
								tmp.contributor = null; //TODO implement
								tmp.Creator = null; //TODO implement
								String dateTmp = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DATE);
								Log.v(LABEL, "date is "+dateTmp);
								tmp.CreateDate = null; //TODO implement
								tmp.location = null; //TODO implement
								tmp.description = null; //TODO implement
								tmp.keyword = null; //TODO implement
								tmp.genre = null; //TODO implement
								tmp.rating = null; //TODO implement
								tmp.relation = null; //TODO implement
								tmp.collection = null; //TODO implement
								tmp.copyright = null; //TODO implement
								tmp.policy = null; //TODO implement
								tmp.publisher = null; //TODO implement
								tmp.targetAudience = null; //TODO implement
								tmp.fragment = null; //TODO implement
								tmp.namedFragment = null; //TODO implement
								tmp.frameSize = null; //TODO implement
								tmp.compression = null; //TODO implement
								tmp.duration = null; //TODO implement
								tmp.format = null; //TODO implement
								tmp.samplingRate = null; //TODO implement
								tmp.framerate = null; //TODO implement
								tmp.averageBitRate = null; //TODO implement
								tmp.numTracks = null; //TODO implement
								
							}
							catch(IllegalArgumentException e) {
								Log.v(LABEL, "Error in processing file metadata (IllegalArgumentException)");
							}
							catch(Exception e) {
								Log.v(LABEL, "Error in processing file metadata");
								ExifInterface exifRetriever = new ExifInterface(dirFiles[j].getAbsolutePath());

								tmp.title = null;
								tmp.language = null; //TODO implement
								tmp.contributor = null; //TODO implement
								tmp.Creator = null; //TODO implement
								String dateTmp = exifRetriever.getAttribute(ExifInterface.TAG_DATETIME);
								Log.v(LABEL, "date is "+dateTmp);
								tmp.CreateDate = null;
								tmp.location = null; //TODO implement
								tmp.description = null; //TODO implement
								tmp.keyword = null; //TODO implement
								tmp.genre = null; //TODO implement
								tmp.rating = null; //TODO implement
								tmp.relation = null; //TODO implement
								tmp.collection = null; //TODO implement
								tmp.copyright = null; //TODO implement
								tmp.policy = null; //TODO implement
								tmp.publisher = null; //TODO implement
								tmp.targetAudience = null; //TODO implement
								tmp.fragment = null; //TODO implement
								tmp.namedFragment = null; //TODO implement
								tmp.frameSize = null; //TODO implement
								tmp.compression = null; //TODO implement
								tmp.duration = null; //TODO implement
								tmp.format = null; //TODO implement
								tmp.samplingRate = null; //TODO implement
								tmp.framerate = null; //TODO implement
								tmp.averageBitRate = null; //TODO implement
								tmp.numTracks = null; //TODO implement

							}
							result.add(tmp);
						}
					}
				}
				
				retriever.release();
				//search results
				 */
				Log.v(LABEL, "GalleryFinder run - 07");
				successCallback.onSuccess(result.toArray(new MediaObject[result.size()]));
				Log.v(LABEL, "GalleryFinder run - 08");
				setSearchInProgress(false);
				Log.v(LABEL, "GalleryFinder run - 09");
			}
			catch(Exception e) {
				Log.v(LABEL, "GalleryFinder run - exception "+e.getMessage());
			}
		}		
	}
	
}

abstract interface GalleryRunnable extends Runnable {
	public abstract void stop();
	public abstract boolean isStopped();
}

class GalleryPendingOperation extends PendingOperation {

	private Thread t=null;
	private GalleryRunnable r=null;
	
	public GalleryPendingOperation(Thread t, GalleryRunnable r) {
		this.t = t;
		this.r = r;
	}

	public void cancel() {
		if(t!=null) {
			//TODO is this interrupt needed???
			t.interrupt();
			if(r!=null)
				r.stop();
		}
	}

}



