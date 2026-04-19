import React from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';
import type { NativeAdMediaViewProps } from '../types';

/**
 * NativeAdMediaView renders the main media asset of a native ad —
 * either a video or a static image.
 *
 * - Mirrors `MediaView` on Android and `GADMediaView` on iOS.
 * - Must be placed inside a `NativeAdView`.
 * - The SDK handles video playback, buffering, and mute state automatically.
 * - Set `resizeMode` to control how the content is scaled within its bounds.
 *
 * **Hardware acceleration note (Android):** Video ads require hardware
 * acceleration to be enabled on the Activity. It is enabled by default;
 * do not disable it for activities that display ads.
 *
 * @example
 * ```tsx
 * <NativeAdView adUnitId="..." renderAd={(ad) => (
 *   <View>
 *     <NativeAdAttribution />
 *     <NativeAdMediaView
 *       style={{ width: '100%', height: 200 }}
 *       resizeMode="cover"
 *     />
 *     <Text>{ad.headline}</Text>
 *   </View>
 * )} />
 * ```
 */
const NativeMediaViewNative = requireNativeComponent<{
  resizeMode?: string;
  style?: object;
}>('RNAdmobNativeMediaView');

export function NativeAdMediaView({ style, resizeMode = 'cover' }: NativeAdMediaViewProps) {
  return (
    <NativeMediaViewNative
      resizeMode={resizeMode}
      style={[styles.mediaView, style]}
    />
  );
}

const styles = StyleSheet.create({
  mediaView: {
    width: '100%',
    aspectRatio: 1.91,
  },
});
