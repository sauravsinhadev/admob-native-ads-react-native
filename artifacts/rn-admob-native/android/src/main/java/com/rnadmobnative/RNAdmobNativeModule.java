package com.rnadmobnative;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * RNAdmobNativeModule — Native module that bridges the Google Mobile Ads SDK
 * AdLoader to JavaScript via React Native's bridge.
 *
 * Threading model:
 * - JS calls arrive on the RN bridge thread.
 * - AdLoader.Builder MUST be called on a background thread (SDK requirement).
 * - UI updates (resolving promises) are posted back to the main thread.
 */
public class RNAdmobNativeModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "RNAdmobNative";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    /** Active loaders keyed by a UUID so JS can reference and destroy them. */
    private final Map<String, NativeAd> activeAds = new HashMap<>();

    public RNAdmobNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // -------------------------------------------------------------------------
    // loadNativeAd — single ad
    // -------------------------------------------------------------------------

    /**
     * Load a single native ad.
     *
     * @param options JS object with adUnitId, nativeAdOptions, adRequestOptions.
     * @param promise Resolved with { loaderId, ad } on success; rejected on failure.
     */
    @ReactMethod
    public void loadNativeAd(ReadableMap options, Promise promise) {
        final String adUnitId = options.hasKey("adUnitId") ? options.getString("adUnitId") : "";
        final ReadableMap nativeAdOpts = options.hasKey("nativeAdOptions") ? options.getMap("nativeAdOptions") : null;

        final String loaderId = UUID.randomUUID().toString();

        // SDK requirement: build AdLoader on a background thread.
        new Thread(() -> {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                mainHandler.post(() -> promise.reject("E_NO_ACTIVITY", "No active activity found."));
                return;
            }

            NativeAdOptions.Builder nativeAdOptionsBuilder = new NativeAdOptions.Builder();
            if (nativeAdOpts != null) {
                applyNativeAdOptions(nativeAdOptionsBuilder, nativeAdOpts);
            }

            AdLoader adLoader = new AdLoader.Builder(activity, adUnitId)
                    .forNativeAd(nativeAd -> {
                        activeAds.put(loaderId, nativeAd);
                        mainHandler.post(() -> {
                            WritableMap result = Arguments.createMap();
                            result.putString("loaderId", loaderId);
                            result.putMap("ad", serializeNativeAd(nativeAd));
                            promise.resolve(result);
                        });
                    })
                    .withAdListener(new AdListener() {
                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError adError) {
                            mainHandler.post(() -> promise.reject(
                                    String.valueOf(adError.getCode()),
                                    adError.getMessage()
                            ));
                        }

                        @Override
                        public void onAdClicked() {
                            // Clicks are handled by the NativeAdView registered views.
                        }

                        @Override
                        public void onAdImpression() {
                            // Impressions are automatically recorded by the SDK.
                        }
                    })
                    .withNativeAdOptions(nativeAdOptionsBuilder.build())
                    .build();

            activity.runOnUiThread(() ->
                    adLoader.loadAd(buildAdRequest(options))
            );
        }).start();
    }

    // -------------------------------------------------------------------------
    // loadNativeAds — multiple ads (up to 5, Google ads only)
    // -------------------------------------------------------------------------

    /**
     * Load multiple native ads (up to 5).
     * Do NOT use with mediation ad unit IDs.
     *
     * @param options JS object with adUnitId, nativeAdOptions, adRequestOptions, count.
     * @param promise Resolved with { loaderId, ads[] } on success; rejected on failure.
     */
    @ReactMethod
    public void loadNativeAds(ReadableMap options, Promise promise) {
        final String adUnitId = options.hasKey("adUnitId") ? options.getString("adUnitId") : "";
        final ReadableMap nativeAdOpts = options.hasKey("nativeAdOptions") ? options.getMap("nativeAdOptions") : null;
        final int count = options.hasKey("count") ? options.getInt("count") : 1;
        final int safeCount = Math.min(Math.max(1, count), 5);

        final String loaderId = UUID.randomUUID().toString();
        final WritableArray collectedAds = Arguments.createArray();
        final boolean[] finished = {false};

        new Thread(() -> {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                mainHandler.post(() -> promise.reject("E_NO_ACTIVITY", "No active activity found."));
                return;
            }

            NativeAdOptions.Builder nativeAdOptionsBuilder = new NativeAdOptions.Builder();
            if (nativeAdOpts != null) {
                applyNativeAdOptions(nativeAdOptionsBuilder, nativeAdOpts);
            }

            AdLoader[] adLoaderHolder = new AdLoader[1];

            adLoaderHolder[0] = new AdLoader.Builder(activity, adUnitId)
                    .forNativeAd(nativeAd -> {
                        activeAds.put(loaderId + "_" + collectedAds.size(), nativeAd);
                        collectedAds.pushMap(serializeNativeAd(nativeAd));

                        // Resolve when loading is finished (isLoading() returns false).
                        if (!adLoaderHolder[0].isLoading() && !finished[0]) {
                            finished[0] = true;
                            mainHandler.post(() -> {
                                WritableMap result = Arguments.createMap();
                                result.putString("loaderId", loaderId);
                                result.putArray("ads", collectedAds);
                                promise.resolve(result);
                            });
                        }
                    })
                    .withAdListener(new AdListener() {
                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError adError) {
                            if (!finished[0]) {
                                finished[0] = true;
                                mainHandler.post(() -> promise.reject(
                                        String.valueOf(adError.getCode()),
                                        adError.getMessage()
                                ));
                            }
                        }
                    })
                    .withNativeAdOptions(nativeAdOptionsBuilder.build())
                    .build();

            final AdLoader loader = adLoaderHolder[0];
            activity.runOnUiThread(() ->
                    loader.loadAds(buildAdRequest(options), safeCount)
            );
        }).start();
    }

    // -------------------------------------------------------------------------
    // destroyNativeAd — releases resources, prevents memory leaks
    // -------------------------------------------------------------------------

    /**
     * Destroy a native ad and release its resources.
     * Always call this when the component displaying the ad unmounts.
     */
    @ReactMethod
    public void destroyNativeAd(ReadableMap options) {
        if (!options.hasKey("loaderId")) return;
        final String loaderId = options.getString("loaderId");

        mainHandler.post(() -> {
            // Destroy single-ad entry
            NativeAd ad = activeAds.remove(loaderId);
            if (ad != null) {
                ad.destroy();
            }
            // Destroy multi-ad entries
            int idx = 0;
            while (true) {
                String key = loaderId + "_" + idx;
                NativeAd multiAd = activeAds.remove(key);
                if (multiAd == null) break;
                multiAd.destroy();
                idx++;
            }
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private AdRequest buildAdRequest(ReadableMap options) {
        AdRequest.Builder builder = new AdRequest.Builder();
        if (options.hasKey("adRequestOptions")) {
            ReadableMap reqOpts = options.getMap("adRequestOptions");
            if (reqOpts != null && reqOpts.hasKey("contentUrl")) {
                builder.setContentUrl(reqOpts.getString("contentUrl"));
            }
        }
        return builder.build();
    }

    private void applyNativeAdOptions(NativeAdOptions.Builder builder, ReadableMap opts) {
        if (opts.hasKey("adChoicesPlacement")) {
            String placement = opts.getString("adChoicesPlacement");
            if ("topLeft".equals(placement)) {
                builder.setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_LEFT);
            } else if ("topRight".equals(placement)) {
                builder.setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT);
            } else if ("bottomLeft".equals(placement)) {
                builder.setAdChoicesPlacement(NativeAdOptions.ADCHOICES_BOTTOM_LEFT);
            } else if ("bottomRight".equals(placement)) {
                builder.setAdChoicesPlacement(NativeAdOptions.ADCHOICES_BOTTOM_RIGHT);
            }
        }
        if (opts.hasKey("mediaAspectRatio")) {
            String ratio = opts.getString("mediaAspectRatio");
            if ("landscape".equals(ratio)) {
                builder.setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_LANDSCAPE);
            } else if ("portrait".equals(ratio)) {
                builder.setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_PORTRAIT);
            } else if ("square".equals(ratio)) {
                builder.setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_SQUARE);
            } else {
                builder.setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_ANY);
            }
        }
        if (opts.hasKey("requestMultipleImages") && opts.getBoolean("requestMultipleImages")) {
            builder.setRequestMultipleImages(true);
        }
        if (opts.hasKey("videoStartMuted")) {
            com.google.android.gms.ads.VideoOptions.Builder videoBuilder =
                    new com.google.android.gms.ads.VideoOptions.Builder();
            videoBuilder.setStartMuted(opts.getBoolean("videoStartMuted"));
            builder.setVideoOptions(videoBuilder.build());
        }
        if (opts.hasKey("customControlsEnabled")) {
            com.google.android.gms.ads.VideoOptions.Builder videoBuilder =
                    new com.google.android.gms.ads.VideoOptions.Builder();
            videoBuilder.setCustomControlsEnabled(opts.getBoolean("customControlsEnabled"));
            builder.setVideoOptions(videoBuilder.build());
        }
    }

    private WritableMap serializeNativeAd(NativeAd ad) {
        WritableMap map = Arguments.createMap();
        map.putString("headline", ad.getHeadline() != null ? ad.getHeadline() : "");
        map.putString("body", ad.getBody());
        map.putString("callToAction", ad.getCallToAction());
        map.putString("advertiser", ad.getAdvertiser());
        map.putString("store", ad.getStore());
        map.putString("price", ad.getPrice());

        if (ad.getStarRating() != null) {
            map.putDouble("starRating", ad.getStarRating());
        } else {
            map.putNull("starRating");
        }

        // Icon
        if (ad.getIcon() != null && ad.getIcon().getUri() != null) {
            WritableMap icon = Arguments.createMap();
            icon.putString("uri", ad.getIcon().getUri().toString());
            icon.putDouble("scale", ad.getIcon().getScale());
            map.putMap("icon", icon);
        } else {
            map.putNull("icon");
        }

        // Images
        if (ad.getImages() != null && !ad.getImages().isEmpty()) {
            WritableArray images = Arguments.createArray();
            for (NativeAd.Image img : ad.getImages()) {
                if (img.getUri() != null) {
                    WritableMap imgMap = Arguments.createMap();
                    imgMap.putString("uri", img.getUri().toString());
                    imgMap.putDouble("scale", img.getScale());
                    images.pushMap(imgMap);
                }
            }
            map.putArray("images", images);
        } else {
            map.putNull("images");
        }

        // Media content
        boolean hasVideo = false;
        double aspectRatio = 0;
        if (ad.getMediaContent() != null) {
            hasVideo = ad.getMediaContent().hasVideoContent();
            aspectRatio = ad.getMediaContent().getAspectRatio();
        }
        map.putBoolean("hasVideoContent", hasVideo);
        map.putDouble("mediaContentAspectRatio", aspectRatio);

        // Response info
        if (ad.getResponseInfo() != null) {
            map.putString("responseInfo", ad.getResponseInfo().toString());
        } else {
            map.putNull("responseInfo");
        }

        return map;
    }
}
