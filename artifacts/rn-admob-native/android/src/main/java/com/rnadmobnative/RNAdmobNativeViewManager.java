package com.rnadmobnative;

import android.content.Context;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.ads.nativead.NativeAdView;

/**
 * RNAdmobNativeViewManager — View manager for the native NativeAdView container.
 *
 * The NativeAdView (Android: com.google.android.gms.ads.nativead.NativeAdView)
 * is a ViewGroup that must wrap all ad asset views. The SDK uses it to:
 *   - Handle click tracking on registered asset views
 *   - Record impressions when the first pixel is visible on screen
 *   - Display the AdChoices overlay in the configured corner
 *
 * In React Native we expose this as a native view component ("RNAdmobNativeView")
 * so that asset views rendered in JS are children of the real NativeAdView in
 * the native view hierarchy.
 */
public class RNAdmobNativeViewManager extends SimpleViewManager<NativeAdView> {

    public static final String REACT_CLASS = "RNAdmobNativeView";

    private final ReactApplicationContext reactContext;

    public RNAdmobNativeViewManager(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected NativeAdView createViewInstance(@NonNull ThemedReactContext reactContext) {
        NativeAdView view = new NativeAdView(reactContext);
        return view;
    }

    /**
     * adUnitId prop — not directly used by the view (loading is handled by the
     * module), but stored for reference and potential future use (e.g. re-render
     * triggers when ad unit ID changes).
     */
    @ReactProp(name = "adUnitId")
    public void setAdUnitId(NativeAdView view, @Nullable String adUnitId) {
        // No-op at the view level; the module handles ad loading.
        view.setTag(adUnitId);
    }
}
