package com.rnadmobnative;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.List;

/**
 * RNAdmobNativePackage — ReactPackage that registers the native modules
 * and view managers with React Native.
 *
 * Add this package to your MainApplication's getPackages() list:
 *
 * <pre>
 * // MainApplication.java (or .kt)
 * &#64;Override
 * protected List&lt;ReactPackage&gt; getPackages() {
 *   return Arrays.asList(
 *     new MainReactPackage(),
 *     new RNAdmobNativePackage()   // &lt;-- add this
 *   );
 * }
 * </pre>
 *
 * If you are using React Native 0.73+ auto-linking, this is done automatically
 * and you do not need to add it manually.
 */
public class RNAdmobNativePackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new RNAdmobNativeModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.asList(
                new RNAdmobNativeViewManager(reactContext),
                new RNAdmobNativeMediaViewManager(reactContext)
        );
    }
}
