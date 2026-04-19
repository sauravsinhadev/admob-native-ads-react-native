package com.rnadmobnative;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.ads.nativead.NativeAdView;

/**
 * RNAdmobNativeViewManager — View manager for the NativeAdView container.
 *
 * NativeAdView is a ViewGroup that must wrap all ad asset views. The SDK uses it to:
 *   - Handle click tracking on registered asset views
 *   - Record impressions when the first pixel is visible on screen
 *   - Display the AdChoices overlay in the configured corner
 *
 * SimpleViewManager subclasses must NOT take ReactApplicationContext in their
 * constructor — RN calls createViewManagers() without passing context.
 */
public class RNAdmobNativeViewManager extends SimpleViewManager<NativeAdView> {

    public static final String REACT_CLASS = "RNAdmobNativeView";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected NativeAdView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new NativeAdView(reactContext);
    }

    @ReactProp(name = "adUnitId")
    public void setAdUnitId(NativeAdView view, @Nullable String adUnitId) {
        view.setTag(adUnitId);
    }
}
