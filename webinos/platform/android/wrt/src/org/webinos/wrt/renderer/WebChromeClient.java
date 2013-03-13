/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *	 http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2011-2012 Paddy Byers
 *
 ******************************************************************************/

package org.webinos.wrt.renderer;

import org.webinos.wrt.R;
import org.webinos.wrt.ui.RendererActivity;

import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.webkit.ConsoleMessage;
import android.webkit.JsResult;

public class WebChromeClient extends android.webkit.WebChromeClient{

	private RendererActivity activity;
	private WebView webView;
	private Bitmap defaultVideoPoster;
	private View videoProgressView;

	private static final String TAG = "org.webinos.wrt.renderer.WebChromeClient";

	public WebChromeClient(RendererActivity activity, WebView webView) {
		this.activity = activity;
		this.webView = webView;
	}

	@Override
	public boolean onJsAlert(android.webkit.WebView view, String url, String message, JsResult result) {
		Log.d(TAG, message);
		new AlertDialog.Builder(view.getContext()).setMessage(message).setCancelable(true).show();
		result.confirm();
		return true;
	}

	@Override
	public void onReceivedTitle(android.webkit.WebView webView, String title) {
		if(title != null && !title.isEmpty())
			activity.setTitle(title);
	}

	@Override
	public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
		Log.v(TAG, consoleMessage.sourceId() + ':' + consoleMessage.lineNumber() + " " + consoleMessage.message());
		return true;
	}

	@Override
	public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
		webView.showCustomView(view, callback);
	}

	@Override
	public void onHideCustomView() {
		webView.hideCustomView();
	}

	@Override
	public Bitmap getDefaultVideoPoster() {
		if (defaultVideoPoster == null) {
			defaultVideoPoster = BitmapFactory.decodeResource(
					activity.getResources(), R.drawable.default_video_poster);
		}
		return defaultVideoPoster;
	}

	@Override
	public View getVideoLoadingProgressView() {
		if (videoProgressView == null) {
			LayoutInflater inflater = LayoutInflater.from(activity);
			videoProgressView = inflater.inflate(R.layout.video_loading_progress, null);
		}
		return videoProgressView; 
	}

	@Override
	public void onProgressChanged(android.webkit.WebView view, int newProgress) {
		activity.getWindow().setFeatureInt(Window.FEATURE_PROGRESS, newProgress * 100);
	}
}
