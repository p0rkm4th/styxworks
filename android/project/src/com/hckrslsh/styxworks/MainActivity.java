package com.hckrslsh.styxworks;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * STYXWORKS shell: a fullscreen WebView hosting the single-file game
 * (assets/index.html). The game is pure HTML/CSS/JS with localStorage
 * saves, so the only critical settings are JavaScript + DOM storage.
 * No network is ever used; the manifest declares no permissions.
 */
public class MainActivity extends Activity {

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0B0E); // match the game's --bg so there's no white flash

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // game saves live in localStorage
        s.setAllowFileAccess(true);        // needed for file:///android_asset/
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);

        // Keep any navigation inside the app (the game has no external links,
        // but belt and braces).
        web.setWebViewClient(new WebViewClient());

        setContentView(web);
        if (savedInstanceState == null) {
            web.loadUrl("file:///android_asset/index.html");
        } else {
            web.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onPause() {
        // Ask the game to flush its save before we can be killed in the
        // background; its own autosave also runs every 5s.
        if (web != null) {
            try { web.evaluateJavascript("if (window.save) save();", null); } catch (Exception ignored) {}
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
