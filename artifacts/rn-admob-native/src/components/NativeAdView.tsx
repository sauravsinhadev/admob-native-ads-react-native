import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  StyleSheet,
  Platform,
} from 'react-native';
import type { NativeAdViewProps, NativeAd, AdError } from '../types';
import { AdLoader } from '../utils/AdLoader';

const NATIVE_AD_VIEW = 'RNAdmobNativeView';

/**
 * NativeAdContainerView — the native UIView / ViewGroup wrapper registered by the
 * native module. All asset child views must be inside this wrapper so that the
 * SDK can register impressions, clicks, and the AdChoices overlay automatically.
 */
const NativeAdContainerView = requireNativeComponent<{
  adUnitId: string;
  nativeAdOptions?: object;
  style?: object;
}>(NATIVE_AD_VIEW);

/**
 * NativeAdView is the top-level component for displaying AdMob native ads in
 * React Native. It mirrors the `NativeAdView` (Android) / `GADNativeAdView`
 * (iOS) container from the Google Mobile Ads SDK.
 *
 * **All asset components (headline, body, icon, media, CTA, etc.) must be
 * rendered as children of this component** — the SDK uses the native container
 * to handle clicks, impressions, and the AdChoices overlay.
 *
 * @example
 * ```tsx
 * import {
 *   NativeAdView,
 *   NativeAdMediaView,
 *   NativeAdAttribution,
 * } from 'react-native-admob-native-ads';
 *
 * export function MyNativeAd() {
 *   return (
 *     <NativeAdView
 *       adUnitId="ca-app-pub-3940256099942544/2247696110"
 *       nativeAdOptions={{ adChoicesPlacement: 'topRight' }}
 *       onAdLoaded={(ad) => console.log('Loaded:', ad.headline)}
 *       onAdFailedToLoad={(err) => console.error(err.message)}
 *       renderAd={(ad) => (
 *         <View style={styles.adCard}>
 *           <NativeAdAttribution />
 *           <NativeAdMediaView style={styles.media} />
 *           <Text style={styles.headline}>{ad.headline}</Text>
 *           {ad.body ? <Text style={styles.body}>{ad.body}</Text> : null}
 *           {ad.callToAction ? (
 *             <View style={styles.ctaButton}>
 *               <Text style={styles.ctaText}>{ad.callToAction}</Text>
 *             </View>
 *           ) : null}
 *         </View>
 *       )}
 *       loadingView={<ActivityIndicator />}
 *     />
 *   );
 * }
 * ```
 */
export function NativeAdView(props: NativeAdViewProps) {
  const {
    adUnitId,
    onAdLoaded,
    onAdFailedToLoad,
    onAdClicked,
    onAdImpression,
    onAdOpened,
    onAdClosed,
    nativeAdOptions,
    adRequestOptions,
    style,
    renderAd,
    loadingView,
    errorView,
    refreshIntervalMs,
    refreshOnMount = true,
  } = props;

  const [ad, setAd] = useState<NativeAd | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [adError, setAdError] = useState<AdError | null>(null);

  const loaderRef = useRef<AdLoader | null>(null);
  const containerRef = useRef<View>(null);
  const isMountedRef = useRef(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destroyCurrent = useCallback(() => {
    if (loaderRef.current) {
      loaderRef.current.destroy();
      loaderRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const loadAd = useCallback(() => {
    if (!isMountedRef.current) return;

    destroyCurrent();
    setLoadState('loading');
    setAdError(null);

    const loader = new AdLoader({
      adUnitId,
      nativeAdOptions,
      adRequestOptions,
      callbacks: {
        onNativeAdLoaded: (loadedAd) => {
          if (!isMountedRef.current) {
            loader.destroy();
            return;
          }
          setAd(loadedAd);
          setLoadState('loaded');
          onAdLoaded?.(loadedAd);

          if (refreshIntervalMs && refreshIntervalMs > 0) {
            refreshTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                loadAd();
              }
            }, refreshIntervalMs);
          }
        },
        onAdFailedToLoad: (err) => {
          if (!isMountedRef.current) return;
          setAdError(err);
          setLoadState('error');
          onAdFailedToLoad?.(err);
        },
        onAdClicked,
        onAdImpression,
        onAdOpened,
        onAdClosed,
      },
    });

    loaderRef.current = loader;
    loader.loadAd();
  }, [
    adUnitId,
    nativeAdOptions,
    adRequestOptions,
    refreshIntervalMs,
    onAdLoaded,
    onAdFailedToLoad,
    onAdClicked,
    onAdImpression,
    onAdOpened,
    onAdClosed,
    destroyCurrent,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    if (refreshOnMount) {
      loadAd();
    }

    return () => {
      isMountedRef.current = false;
      destroyCurrent();
    };
  }, []);

  if (loadState === 'loading') {
    return (
      <View style={[styles.container, style]}>
        {loadingView ?? null}
      </View>
    );
  }

  if (loadState === 'error' || !ad) {
    return (
      <View style={[styles.container, style]}>
        {errorView ?? null}
      </View>
    );
  }

  return (
    <NativeAdContainerView
      adUnitId={adUnitId}
      nativeAdOptions={nativeAdOptions}
      style={[styles.container, style]}
    >
      {renderAd(ad)}
    </NativeAdContainerView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
