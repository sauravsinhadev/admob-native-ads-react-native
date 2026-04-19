import { useState, useEffect, useCallback, useRef } from 'react';
import { AdLoader } from '../utils/AdLoader';
import type {
  NativeAd,
  AdError,
  UseNativeAdResult,
  UseNativeAdOptions,
} from '../types';

/**
 * useNativeAd — React hook for loading AdMob native ads.
 *
 * Manages the full ad lifecycle including loading, error handling,
 * and cleanup on unmount. Automatically calls `destroy()` on the
 * loaded native ad when the component unmounts to prevent memory leaks.
 *
 * @example
 * ```tsx
 * function MyNativeAd() {
 *   const { ad, isLoading, error, refresh } = useNativeAd({
 *     adUnitId: 'ca-app-pub-3940256099942544/2247696110',
 *     nativeAdOptions: { adChoicesPlacement: 'topRight' },
 *   });
 *
 *   if (isLoading) return <ActivityIndicator />;
 *   if (error || !ad) return null;
 *
 *   return (
 *     <View>
 *       <Text>{ad.headline}</Text>
 *       {ad.body ? <Text>{ad.body}</Text> : null}
 *     </View>
 *   );
 * }
 * ```
 */
export function useNativeAd(options: UseNativeAdOptions): UseNativeAdResult {
  const { adUnitId, nativeAdOptions, adRequestOptions, loadOnMount = true } = options;

  const [ad, setAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AdError | null>(null);

  const loaderRef = useRef<AdLoader | null>(null);
  const isMountedRef = useRef(true);

  const destroyCurrent = useCallback(() => {
    if (loaderRef.current) {
      loaderRef.current.destroy();
      loaderRef.current = null;
    }
  }, []);

  const load = useCallback(() => {
    if (!isMountedRef.current) return;

    destroyCurrent();
    setIsLoading(true);
    setError(null);

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
          setIsLoading(false);
          setError(null);
        },
        onAdFailedToLoad: (adError) => {
          if (!isMountedRef.current) return;
          setError(adError);
          setIsLoading(false);
        },
      },
    });

    loaderRef.current = loader;
    loader.loadAd();
  }, [adUnitId, nativeAdOptions, adRequestOptions, destroyCurrent]);

  useEffect(() => {
    isMountedRef.current = true;

    if (loadOnMount) {
      load();
    }

    return () => {
      isMountedRef.current = false;
      destroyCurrent();
    };
  }, []);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { ad, isLoading, error, refresh };
}
