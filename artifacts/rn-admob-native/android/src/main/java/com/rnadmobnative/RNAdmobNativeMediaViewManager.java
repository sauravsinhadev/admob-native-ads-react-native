package com.rnadmobnative;

import android.widget.ImageView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.ads.nativead.MediaView;

/**
 * RNAdmobNativeMediaViewManager — View manager for the MediaView component.
 *
 * The MediaView (com.google.android.gms.ads.nativead.MediaView) displays the
 * main visual asset of a native ad:
 *   - If the ad has video content, the video is buffered and plays automatically.
 *   - If no video is present, the main image asset is displayed instead.
 *
 * Place NativeAdMediaView inside your NativeAdView renderAd layout.
 * The SDK handles all playback, buffering, and mute controls internally.
 *
 * Hardware acceleration MUST be enabled on the host Activity for video playback.
 */
public class RNAdmobNativeMediaViewManager extends SimpleViewManager<MediaView> {

    public static final String REACT_CLASS = "RNAdmobNativeMediaView";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected MediaView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new MediaView(reactContext);
    }

    /**
     * resizeMode prop — controls how the image is scaled within the MediaView.
     * Maps React Native resize modes to Android ImageView.ScaleType.
     */
    @ReactProp(name = "resizeMode")
    public void setResizeMode(MediaView view, @Nullable String resizeMode) {
        if (resizeMode == null) resizeMode = "cover";
        switch (resizeMode) {
            case "contain":
                view.setImageScaleType(ImageView.ScaleType.FIT_CENTER);
                break;
            case "stretch":
                view.setImageScaleType(ImageView.ScaleType.FIT_XY);
                break;
            case "center":
                view.setImageScaleType(ImageView.ScaleType.CENTER);
                break;
            case "cover":
            default:
                view.setImageScaleType(ImageView.ScaleType.CENTER_CROP);
                break;
        }
    }
}
