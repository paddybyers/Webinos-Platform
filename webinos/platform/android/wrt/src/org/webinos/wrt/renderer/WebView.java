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

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.widget.FrameLayout;

public class WebView extends android.webkit.WebView {

	private static final String TAG = "org.webinos.wrt.renderer.WebView";

	private View customView;
	private FrameLayout customViewContainer;
	private WebChromeClient.CustomViewCallback customViewCallback;

	private FrameLayout	contentView;
	private FrameLayout	browserFrameLayout;
	private FrameLayout	layout;

	private static final FrameLayout.LayoutParams COVER_SCREEN_PARAMS =
			new FrameLayout.LayoutParams( ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);

	public WebView(Context context) {
		super(context);
		init((RendererActivity)context);
	}

	public WebView(Context context, AttributeSet as) {
		super(context, as);
		init((RendererActivity)context);
	}

	@SuppressLint("SetJavaScriptEnabled")
	private void init(RendererActivity rendererActivity) {
		layout = new FrameLayout(rendererActivity);
		browserFrameLayout = (FrameLayout)LayoutInflater.from(rendererActivity).inflate(R.layout.custom_screen, null);
		contentView = (FrameLayout)browserFrameLayout.findViewById(R.id.main_content);
		customViewContainer = (FrameLayout)browserFrameLayout.findViewById(R.id.fullscreen_custom_content);

		layout.addView(browserFrameLayout, COVER_SCREEN_PARAMS);

		WebSettings settings = getSettings();
		settings.setBuiltInZoomControls(true);
		settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NARROW_COLUMNS);
		//		settings.setUseWideViewPort(true);
		//		settings.setLoadWithOverviewMode(true);
		settings.setJavaScriptEnabled(true);
		/* temporary: until we have the widget API */
		settings.setDomStorageEnabled(true);
		/* TO avoid the scrollbar issue
		 * http://forum.jquery.com/topic/extra-vertical-white-space-at-right-on-screen-for-android-phone */
		setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);

		setWebViewClient(new WebViewClient(rendererActivity));
		setWebChromeClient(new WebChromeClient(rendererActivity, this));

		contentView.addView(this);
	}

	public FrameLayout getLayout() {
		return layout;
	}

	public boolean inCustomView() {
		return (customView != null);
	}

	public void showCustomView(View view, WebChromeClient.CustomViewCallback callback) {
		setVisibility(View.GONE);

		// if a view already exists then immediately terminate the new one
		if (customView != null) {
			callback.onCustomViewHidden();
			return;
		}

		customViewContainer.addView(view);
		customView = view;
		customViewCallback = callback;
		customViewContainer.setVisibility(View.VISIBLE);
	}

	public void hideCustomView() {
		if (customView == null)
			return;

		// Hide the custom view.
		customView.setVisibility(View.GONE);

		// Remove the custom view from its container.
		customViewContainer.removeView(customView);
		customView = null;
		customViewContainer.setVisibility(View.GONE);
		customViewCallback.onCustomViewHidden();

		setVisibility(View.VISIBLE);
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		if (keyCode == KeyEvent.KEYCODE_BACK) {
			if ((customView == null) && canGoBack()){
				goBack();
				return true;
			}
		}
		return super.onKeyDown(keyCode, event);
	}

	public void injectScript(String script) {
		Log.i(TAG,"inject script called:"+ script);
		try {
			String functionBody = "var s=document.createElement('script');"
					+ "s.text=" + script + ";"
					+ "var target = document.head || document;"
					+ "target.appendChild(s);"
					+ "console.log('injected script');";
			loadUrl("javascript:(function(){" + functionBody + "})()");
		} catch (Throwable t) {
			Log.e(TAG, "Error in injecting script", t);
		}
	}

	public void injectScripts(String[] scripts) {
		Log.i(TAG,"inject scripts called");
		try {
			for (String script : scripts)
				loadUrl("javascript:(function(){" + script + "})()");
		} catch (Throwable t) {
			Log.e(TAG, "Error in injecting script", t);
		}
	}

	public void callScript(final String script) {
		Log.i(TAG,"call script called:" + script);
		Log.v("org.webinos.wrt.renderer.WebView.callScript()", script);
		try {
			getHandler().post(new Runnable() {
				public void run() {
					loadUrl("javascript:(function(){" + script + "})()");
				}
			});
		} catch (Throwable t) {
			Log.e(TAG, "Error in JavaScript callback", t);
		}
	}
}
