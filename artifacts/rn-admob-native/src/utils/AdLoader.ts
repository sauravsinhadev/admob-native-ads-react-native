import { NativeModules, Platform } from 'react-native';
import type {
  NativeAd,
  AdError,
  AdLoaderCallbacks,
  AdRequestOptions,
  NativeAdOptions,
} from '../types';

const { RNAdmobNative } = NativeModules;

function throwIfUnsupported() {
  if (!RNAdmobNative) {
    throw new Error(
      '[react-native-admob-native-ads] Native module RNAdmobNative is not linked. ' +
        'Make sure you have followed the installation steps in the README.\n' +
        'Android: run `./gradlew assembleDebug`\n' +
        'iOS: run `pod install && npx react-native run-ios`'
    );
  }
}

/**
 * AdLoader is the primary API for loading AdMob native ads imperatively.
 *
 * Mirrors the Android `AdLoader` class from the Google Mobile Ads SDK.
 * For most use cases, prefer the `NativeAdView` component or `useNativeAd`
 * hook instead — they manage the AdLoader lifecycle automatically.
 *
 * @example
 * ```typescript
 * const loader = new AdLoader({
 *   adUnitId: 'ca-app-pub-3940256099942544/2247696110',
 *   nativeAdOptions: { adChoicesPlacement: 'topRight' },
 *   callbacks: {
 *     onNativeAdLoaded: (ad) => console.log('Ad loaded:', ad.headline),
 *     onAdFailedToLoad: (err) => console.error('Failed:', err.message),
 *     onAdClicked: () => console.log('Ad clicked'),
 *   },
 * });
 *
 * // Load a single ad
 * await loader.loadAd();
 *
 * // Load multiple ads (max 5, Google ads only — do not use with mediation)
 * await loader.loadAds(3);
 *
 * // When done, destroy to free resources
 * loader.destroy();
 * ```
 */
export class AdLoader {
  private readonly adUnitId: string;
  private readonly nativeAdOptions: NativeAdOptions;
  private readonly adRequestOptions: AdRequestOptions;
  private readonly callbacks: AdLoaderCallbacks;
  private loaderId: string | null = null;
  private destroyed = false;

  constructor(config: {
    adUnitId: string;
    nativeAdOptions?: NativeAdOptions;
    adRequestOptions?: AdRequestOptions;
    callbacks: AdLoaderCallbacks;
  }) {
    this.adUnitId = config.adUnitId;
    this.nativeAdOptions = config.nativeAdOptions ?? {};
    this.adRequestOptions = config.adRequestOptions ?? {};
    this.callbacks = config.callbacks;
  }

  /**
   * Load a single native ad. Calls `onNativeAdLoaded` on success,
   * or `onAdFailedToLoad` on failure.
   *
   * Do not call `loadAd()` again before the first request has completed.
   */
  async loadAd(): Promise<void> {
    throwIfUnsupported();
    this.assertNotDestroyed();

    try {
      const { loaderId, ad } = await RNAdmobNative.loadNativeAd({
        adUnitId: this.adUnitId,
        nativeAdOptions: this.nativeAdOptions,
        adRequestOptions: this.adRequestOptions,
        count: 1,
        onAdClicked: this.callbacks.onAdClicked,
        onAdOpened: this.callbacks.onAdOpened,
        onAdClosed: this.callbacks.onAdClosed,
        onAdImpression: this.callbacks.onAdImpression,
      });
      this.loaderId = loaderId;
      this.callbacks.onNativeAdLoaded(ad as NativeAd);
    } catch (err: any) {
      const adError: AdError = {
        code: err?.code ?? -1,
        message: err?.message ?? 'Unknown error',
        domain: err?.domain ?? (Platform.OS === 'android' ? 'com.google.android.gms.ads' : 'com.google.admob'),
      };
      this.callbacks.onAdFailedToLoad?.(adError);
    }
  }

  /**
   * Load multiple native ads (up to 5).
   *
   * **Important:** Do NOT use with mediation ad unit IDs — multiple ad
   * requests are not supported for mediation. This calls `onNativeAdLoaded`
   * once per successfully loaded ad.
   *
   * @param count Number of ads to request. Capped at 5 by the SDK.
   */
  async loadAds(count: number): Promise<void> {
    throwIfUnsupported();
    this.assertNotDestroyed();

    const safeCount = Math.min(Math.max(1, count), 5);

    try {
      const { loaderId, ads } = await RNAdmobNative.loadNativeAds({
        adUnitId: this.adUnitId,
        nativeAdOptions: this.nativeAdOptions,
        adRequestOptions: this.adRequestOptions,
        count: safeCount,
        onAdClicked: this.callbacks.onAdClicked,
        onAdOpened: this.callbacks.onAdOpened,
        onAdClosed: this.callbacks.onAdClosed,
        onAdImpression: this.callbacks.onAdImpression,
      });
      this.loaderId = loaderId;
      for (const ad of ads as NativeAd[]) {
        this.callbacks.onNativeAdLoaded(ad);
      }
    } catch (err: any) {
      const adError: AdError = {
        code: err?.code ?? -1,
        message: err?.message ?? 'Unknown error',
        domain: err?.domain ?? 'com.google.android.gms.ads',
      };
      this.callbacks.onAdFailedToLoad?.(adError);
    }
  }

  /**
   * Destroy this loader and free all associated native resources.
   * Call this when the component that owns this loader is unmounted.
   *
   * Mirrors `NativeAd.destroy()` from the Android SDK.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.loaderId && RNAdmobNative?.destroyNativeAd) {
      RNAdmobNative.destroyNativeAd({ loaderId: this.loaderId });
    }
    this.loaderId = null;
  }

  private assertNotDestroyed() {
    if (this.destroyed) {
      throw new Error(
        '[AdLoader] This AdLoader instance has been destroyed. Create a new instance to load ads.'
      );
    }
  }
}
