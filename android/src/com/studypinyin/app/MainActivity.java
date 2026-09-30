package com.studypinyin.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.webkit.*;
import java.io.*;
import java.util.*;

/** Serves APK assets on a stable HTTPS origin; no server or internet permission. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html";
    private WebView web;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(247, 244, 236));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return serve(request);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
        });
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return serve(request);
                }
            });
        }
        setContentView(web);
        // Android 15 enforces edge-to-edge: protect page controls from system bars.
        web.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        web.requestApplyInsets();
        if (saved == null || web.restoreState(saved) == null) web.loadUrl(HOME);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost());
    }

    private WebResourceResponse serve(WebResourceRequest request) {
        Uri uri = request.getUrl();
        String path = uri.getPath();
        if (!isLocal(uri) || path == null || !path.startsWith("/assets/") || path.contains("..")) return error(403, "Forbidden");
        path = path.substring(8);
        if (path.isEmpty()) path = "index.html";
        String mime = "application/octet-stream";
        if (path.endsWith(".html")) mime = "text/html";
        else if (path.endsWith(".js")) mime = "text/javascript";
        else if (path.endsWith(".css")) mime = "text/css";
        else if (path.endsWith(".json") || path.endsWith(".webmanifest")) mime = "application/json";
        else if (path.endsWith(".svg")) mime = "image/svg+xml";
        else if (path.endsWith(".woff2")) mime = "font/woff2";
        else if (path.endsWith(".mp3")) mime = "audio/mpeg";
        else if (path.endsWith(".txt") || path.endsWith(".md")) mime = "text/plain";
        try (InputStream input = getAssets().open(path); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            byte[] bytes = output.toByteArray();
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            headers.put("Accept-Ranges", "bytes");
            int start = 0, end = bytes.length - 1, status = 200;
            String range = null;
            for (Map.Entry<String, String> header : request.getRequestHeaders().entrySet()) {
                if ("Range".equalsIgnoreCase(header.getKey())) range = header.getValue();
            }
            if (range != null && range.startsWith("bytes=")) {
                String[] limits = range.substring(6).split("-", -1);
                if (limits.length != 2) return error(416, "Range Not Satisfiable");
                if (limits[0].isEmpty()) start = Math.max(0, bytes.length - Integer.parseInt(limits[1]));
                else {
                    start = Integer.parseInt(limits[0]);
                    if (!limits[1].isEmpty()) end = Math.min(end, Integer.parseInt(limits[1]));
                }
                if (start < 0 || start > end) return error(416, "Range Not Satisfiable");
                status = 206;
                headers.put("Content-Range", "bytes " + start + "-" + end + "/" + bytes.length);
            }
            int length = Math.max(0, end - start + 1);
            headers.put("Content-Length", String.valueOf(length));
            return new WebResourceResponse(mime, mime.startsWith("text/") ? "UTF-8" : null, status,
                status == 206 ? "Partial Content" : "OK", headers, new ByteArrayInputStream(bytes, start, length));
        } catch (NumberFormatException e) { return error(416, "Range Not Satisfiable"); }
        catch (IOException e) { return error(404, "Not Found"); }
    }

    private static WebResourceResponse error(int status, String message) {
        return new WebResourceResponse("text/plain", "UTF-8", status, message, Collections.emptyMap(),
            new ByteArrayInputStream(new byte[0]));
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("location.hash", hash -> {
            if ("\"#/practice\"".equals(hash)) web.evaluateJavascript("location.hash = ''", null);
            else finish();
        });
    }
    @Override protected void onSaveInstanceState(Bundle out) { web.saveState(out); super.onSaveInstanceState(out); }
    @Override protected void onPause() {
        web.evaluateJavascript("window.dispatchEvent(new Event('pinyin:pause'))", null);
        web.onPause();
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
