import type { ViewStyle, StyleProp, TextStyle, ImageStyle } from 'react-native';

/**
 * Represents the AdMob native ad object returned after a successful load.
 * All fields except headline are optional — check before rendering.
 */
export interface NativeAd {
  /** The headline / title of the native ad. Always present. */
  headline: string;
  /** Body text / description. May be null. */
  body: string | null;
  /** Call-to-action button label (e.g. "Install", "Shop Now"). May be null. */
  callToAction: string | null;
  /** Icon asset of the advertiser app or brand. May be null. */
  icon: NativeAdImage | null;
  /** Main image asset of the ad. May be null when a video is present. */
  images: NativeAdImage[] | null;
  /** Advertiser name / store name. May be null. */
  advertiser: string | null;
  /** App store name (e.g. "Google Play"). May be null. */
  store: string | null;
  /** App price string (e.g. "Free", "$0.99"). May be null. */
  price: string | null;
  /** Star rating (0–5). May be null. */
  starRating: number | null;
  /** Whether the ad has a video content asset. */
  hasVideoContent: boolean;
  /** Aspect ratio of the media content (width / height). */
  mediaContentAspectRatio: number | null;
  /** Internal response info (for debugging). */
  responseInfo: string | null;
}

/**
 * Represents an image asset (icon or main image) within a native ad.
 */
export interface NativeAdImage {
  /** URL of the image. */
  uri: string;
  /** Scale factor for the image. */
  scale: number;
}

/**
 * Ad load error passed to onAdFailedToLoad.
 */
export interface AdError {
  /** Numeric error code. */
  code: number;
  /** Human-readable error message. */
  message: string;
  /** Error domain string. */
  domain: string;
}

/**
 * Options passed to AdLoader.loadAd / AdLoader.loadAds.
 */
export interface AdRequestOptions {
  /**
   * Keywords for ad targeting (e.g. ["fitness", "sports"]).
   */
  keywords?: string[];
  /**
   * Content URL that the ad should be matched against.
   */
  contentUrl?: string;
  /**
   * Request non-personalized ads only.
   * Use when you don't have user consent for personalized ads.
   */
  requestNonPersonalizedAdsOnly?: boolean;
  /**
   * Extras for ad network mediation adapters.
   */
  extras?: Record<string, string>;
}

/**
 * Options for configuring NativeAdOptions (via NativeAdOptions.Builder equivalent).
 */
export interface NativeAdOptions {
  /**
   * Where to place the AdChoices icon.
   * @default 'topRight'
   */
  adChoicesPlacement?: AdChoicesPlacement;
  /**
   * Media aspect ratio preference.
   * @default 'any'
   */
  mediaAspectRatio?: MediaAspectRatio;
  /**
   * Request custom click gesture (advanced).
   * @default false
   */
  requestCustomMuteThisAd?: boolean;
  /**
   * Whether to request multiple images for a single ad.
   * @default false
   */
  requestMultipleImages?: boolean;
  /**
   * Start video ads muted.
   * @default true
   */
  videoStartMuted?: boolean;
  /**
   * Enable custom controls for video ads (play/pause/mute).
   * @default false
   */
  customControlsEnabled?: boolean;
}

/**
 * Placement of the AdChoices overlay icon.
 */
export type AdChoicesPlacement =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

/**
 * Media aspect ratio hint for the ad request.
 */
export type MediaAspectRatio =
  | 'any'
  | 'landscape'
  | 'portrait'
  | 'square'
  | 'unknown';

/**
 * Image resize mode for the MediaView.
 * Maps to React Native ImageResizeMode values.
 */
export type MediaViewResizeMode = 'cover' | 'contain' | 'stretch' | 'center';

/**
 * Callbacks fired by AdLoader during the ad lifecycle.
 */
export interface AdLoaderCallbacks {
  /** Fired when a native ad has loaded successfully. */
  onNativeAdLoaded: (ad: NativeAd) => void;
  /** Fired when the ad request fails. */
  onAdFailedToLoad?: (error: AdError) => void;
  /** Fired when the ad is opened (e.g. user tapped, overlay shown). */
  onAdOpened?: () => void;
  /** Fired when the overlay/browser is closed and app resumes. */
  onAdClosed?: () => void;
  /** Fired when the ad records a click. */
  onAdClicked?: () => void;
  /** Fired when the ad records an impression. */
  onAdImpression?: () => void;
}

/**
 * Props for the top-level NativeAdView container.
 * Wrap all native ad asset views inside this component.
 */
export interface NativeAdViewProps {
  /**
   * Your AdMob ad unit ID.
   * Use the test ID during development:
   *   Android: ca-app-pub-3940256099942544/2247696110
   *   iOS:     ca-app-pub-3940256099942544/3986624511
   */
  adUnitId: string;
  /**
   * Fired when a native ad has loaded and is ready to display.
   */
  onAdLoaded?: (ad: NativeAd) => void;
  /**
   * Fired when the ad request fails.
   */
  onAdFailedToLoad?: (error: AdError) => void;
  /**
   * Fired when the user taps the ad (click recorded).
   */
  onAdClicked?: () => void;
  /**
   * Fired when an impression is recorded.
   */
  onAdImpression?: () => void;
  /**
   * Fired when the ad overlay is opened.
   */
  onAdOpened?: () => void;
  /**
   * Fired when the ad overlay is closed.
   */
  onAdClosed?: () => void;
  /**
   * NativeAdOptions to customise how the ad request is made.
   */
  nativeAdOptions?: NativeAdOptions;
  /**
   * AdRequest targeting options.
   */
  adRequestOptions?: AdRequestOptions;
  /**
   * Style for the outer container view.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Your render function that receives the loaded NativeAd object and
   * returns the ad layout. All asset components rendered here must be
   * children of this NativeAdView.
   */
  renderAd: (ad: NativeAd) => React.ReactNode;
  /**
   * Optional fallback content to display while the ad is loading.
   */
  loadingView?: React.ReactNode;
  /**
   * Optional content to display when the ad fails to load.
   */
  errorView?: React.ReactNode;
  /**
   * Automatically reload the ad after this many milliseconds.
   * Omit to disable auto-refresh.
   */
  refreshIntervalMs?: number;
  /**
   * Whether to destroy and reload the ad when the component remounts.
   * @default true
   */
  refreshOnMount?: boolean;
}

/**
 * Props for the NativeAdMediaView.
 * Renders the main image or video of the native ad.
 * Must be placed inside a NativeAdView.
 */
export interface NativeAdMediaViewProps {
  style?: StyleProp<ViewStyle>;
  /**
   * Controls how the media (image/video) is scaled within its bounds.
   * @default 'cover'
   */
  resizeMode?: MediaViewResizeMode;
}

/**
 * Props for the NativeAdAttribution badge.
 * Displays an "Ad" label — required by AdMob policy.
 */
export interface NativeAdAttributionProps {
  /**
   * The label text to display.
   * @default 'Ad'
   */
  text?: string;
  /**
   * Style for the outer badge container.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style for the label text.
   */
  textStyle?: StyleProp<TextStyle>;
  /**
   * Custom background color.
   * @default '#FFCC66'
   */
  badgeColor?: string;
  /**
   * Custom text color.
   * @default '#333333'
   */
  textColor?: string;
}

/**
 * Individual asset wrapper props (headline, body, CTA, etc.).
 * Use these wrappers so the SDK can register click / impression tracking.
 */
export interface NativeAdAssetViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Props for a text asset view (headline, body, advertiser, store, price).
 */
export interface NativeAdTextViewProps {
  style?: StyleProp<TextStyle>;
  /** Text to display (pass the corresponding field from NativeAd). */
  text?: string | null;
  /** Number of lines. Default: unlimited. */
  numberOfLines?: number;
}

/**
 * Props for the icon image asset.
 */
export interface NativeAdIconViewProps {
  style?: StyleProp<ImageStyle>;
  /** Radius for the icon (e.g. 4 for slightly rounded). @default 4 */
  borderRadius?: number;
}

/**
 * Props for the star rating asset view.
 */
export interface NativeAdStarRatingViewProps {
  /** The starRating value from NativeAd (0–5). */
  starRating?: number | null;
  style?: StyleProp<ViewStyle>;
  /** Color of filled stars. @default '#FFD700' */
  starColor?: string;
  /** Color of empty stars. @default '#CCCCCC' */
  emptyStarColor?: string;
  /** Size of each star in points. @default 14 */
  starSize?: number;
}

/**
 * State returned by useNativeAd hook.
 */
export interface UseNativeAdResult {
  /** The loaded native ad, or null if not yet loaded. */
  ad: NativeAd | null;
  /** True while an ad is being fetched. */
  isLoading: boolean;
  /** The most recent load error, or null. */
  error: AdError | null;
  /** Call to manually refresh / reload the ad. */
  refresh: () => void;
}

/**
 * Options for the useNativeAd hook.
 */
export interface UseNativeAdOptions {
  adUnitId: string;
  nativeAdOptions?: NativeAdOptions;
  adRequestOptions?: AdRequestOptions;
  /** Load the ad immediately on mount. @default true */
  loadOnMount?: boolean;
}
