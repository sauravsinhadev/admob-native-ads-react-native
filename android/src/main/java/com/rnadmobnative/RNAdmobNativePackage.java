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
 * For React Native 0.73+ with auto-linking this is registered automatically.
 * For manual linking, add to MainApplication.getPackages():
 *
 *   new RNAdmobNativePackage()
 */
public class RNAdmobNativePackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new RNAdmobNativeModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.asList(
                new RNAdmobNativeViewManager(),
                new RNAdmobNativeMediaViewManager()
        );
    }
}
