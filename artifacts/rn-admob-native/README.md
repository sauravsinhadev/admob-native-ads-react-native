# react-native-admob-native-ads

A complete React Native package for displaying **AdMob Native Ads** with full customization support. Built for React Native **0.85+** with TypeScript-first design.

Mirrors the [official Google AdMob Native Ads documentation](https://developers.google.com/admob/android/native) and [Advanced guide](https://developers.google.com/admob/android/native/advanced) for both Android and iOS.

---

## Features

- Full AdMob Native Ad support — all assets (headline, body, icon, media, CTA, star rating, price, store, advertiser)
- `NativeAdView` component — render any custom layout with full ad tracking
- `useNativeAd` hook — headless access for custom rendering
- `AdLoader` class — imperative API for advanced use cases
- `NativeAdMediaView` — video + image media asset (SDK-managed playback)
- `NativeAdAttribution` — required "Ad" badge (policy-compliant)
- Full `NativeAdOptions` support — AdChoices placement, media aspect ratio, mute/custom controls
- Multiple ad loading (`loadAds`, up to 5 ads)
- Auto-refresh support
- Proper `destroy()` lifecycle — no memory leaks
- TypeScript types for every prop, option, and callback

---

## Installation

```bash
npm install react-native-admob-native-ads
# or
yarn add react-native-admob-native-ads
```

### Android setup

#### 1. Add the Google Mobile Ads SDK dependency

In `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-ads:23.5.0'
}
```

#### 2. Add your AdMob App ID to AndroidManifest.xml

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <application>
        <!-- Replace with your real AdMob App ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy" />
    </application>
</manifest>
```

#### 3. Enable hardware acceleration (required for video ads)

```xml
<application android:hardwareAccelerated="true">
    <activity android:hardwareAccelerated="true" />
</application>
```

Hardware acceleration is **enabled by default** in new projects. Only add this explicitly if you have disabled it.

#### 4. Initialize the Mobile Ads SDK (once, at app startup)

```kotlin
// MainApplication.kt
MobileAds.initialize(this) {}
```

```java
// MainApplication.java
MobileAds.initialize(this, initializationStatus -> {});
```

---

### iOS setup

#### 1. Add the Google Mobile Ads SDK via CocoaPods

In `ios/Podfile`:

```ruby
pod 'Google-Mobile-Ads-SDK', '~> 11.0'
```

Then run:

```bash
cd ios && pod install
```

#### 2. Add your AdMob App ID to Info.plist

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy</string>
```

#### 3. Add SKAdNetworkItems to Info.plist (required for iOS 14+)

Follow the [Google AdMob iOS SKAdNetwork guide](https://developers.google.com/admob/ios/ios14) for the full list.

#### 4. Initialize the Mobile Ads SDK

```objc
// AppDelegate.m
#import <GoogleMobileAds/GoogleMobileAds.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [[GADMobileAds sharedInstance] startWithCompletionHandler:nil];
    // ...
}
```

---

## Always test with test ads

During development, always use the official Google test ad unit IDs:

| Platform | Test Ad Unit ID |
|----------|-----------------|
| Android  | `ca-app-pub-3940256099942544/2247696110` |
| iOS      | `ca-app-pub-3940256099942544/3986624511` |

**Replace these with your real ad unit IDs before publishing.**

---

## Usage

### 1. NativeAdView component (recommended)

The `NativeAdView` component handles loading, lifecycle, and cleanup automatically. Use `renderAd` to supply your fully custom layout — all native ad assets must be rendered inside this function.

```tsx
import {
  NativeAdView,
  NativeAdMediaView,
  NativeAdAttribution,
} from 'react-native-admob-native-ads';

function MyNativeAd() {
  return (
    <NativeAdView
      adUnitId="ca-app-pub-3940256099942544/2247696110"
      nativeAdOptions={{
        adChoicesPlacement: 'topRight',   // 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
        mediaAspectRatio: 'landscape',    // 'any' | 'landscape' | 'portrait' | 'square'
        videoStartMuted: true,
        customControlsEnabled: false,
      }}
      adRequestOptions={{
        keywords: ['technology', 'shopping'],
        requestNonPersonalizedAdsOnly: false,
      }}
      onAdLoaded={(ad) => console.log('Loaded:', ad.headline)}
      onAdFailedToLoad={(err) => console.error('Error:', err.message)}
      onAdClicked={() => console.log('Clicked')}
      onAdImpression={() => console.log('Impression')}
      onAdOpened={() => console.log('Opened')}
      onAdClosed={() => console.log('Closed')}
      refreshIntervalMs={60000}   // auto-refresh every 60 seconds (optional)
      renderAd={(ad) => (
        <View style={styles.card}>
          {/* Required: Ad attribution badge */}
          <NativeAdAttribution text="Ad" badgeColor="#FFCC66" textColor="#333" />

          {/* Icon + headline + advertiser */}
          <View style={styles.header}>
            {ad.icon && (
              <Image source={{ uri: ad.icon.uri }} style={styles.icon} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.headline}>{ad.headline}</Text>
              {ad.advertiser && <Text style={styles.advertiser}>{ad.advertiser}</Text>}
            </View>
          </View>

          {/* Main media (video or image) — SDK-managed */}
          <NativeAdMediaView style={styles.media} resizeMode="cover" />

          {/* Body text */}
          {ad.body && <Text style={styles.body}>{ad.body}</Text>}

          {/* Star rating */}
          {ad.starRating && (
            <Text style={styles.stars}>★ {ad.starRating.toFixed(1)}</Text>
          )}

          {/* Price and store */}
          {ad.price && <Text style={styles.price}>{ad.price}</Text>}
          {ad.store && <Text style={styles.store}>{ad.store}</Text>}

          {/* Call to action — do NOT add onPress; the SDK handles clicks */}
          {ad.callToAction && (
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{ad.callToAction}</Text>
            </View>
          )}
        </View>
      )}
      loadingView={<ActivityIndicator />}
      errorView={<Text>Ad not available</Text>}
    />
  );
}
```

---

### 2. useNativeAd hook

Use the hook when you need full control over when and how the ad is displayed, or when you want to integrate ad data into an existing component tree.

```tsx
import { useNativeAd } from 'react-native-admob-native-ads';

function MyScreen() {
  const { ad, isLoading, error, refresh } = useNativeAd({
    adUnitId: 'ca-app-pub-3940256099942544/2247696110',
    nativeAdOptions: {
      adChoicesPlacement: 'topRight',
      mediaAspectRatio: 'landscape',
    },
    loadOnMount: true,   // default: true
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) {
    return (
      <View>
        <Text>Ad error: {error.message} (code {error.code})</Text>
        <Button title="Retry" onPress={refresh} />
      </View>
    );
  }
  if (!ad) return null;

  return (
    <View>
      <Text>{ad.headline}</Text>
      {ad.body && <Text>{ad.body}</Text>}
      <Button title="Refresh ad" onPress={refresh} />
    </View>
  );
}
```

---

### 3. AdLoader class (advanced / imperative)

Use `AdLoader` when you need direct control — for example to load multiple ads at once for a list, or to manage the ad lifecycle yourself.

```tsx
import { AdLoader } from 'react-native-admob-native-ads';

// Create the loader
const loader = new AdLoader({
  adUnitId: 'ca-app-pub-3940256099942544/2247696110',
  nativeAdOptions: {
    adChoicesPlacement: 'topRight',
    mediaAspectRatio: 'any',
  },
  adRequestOptions: {
    keywords: ['fitness'],
  },
  callbacks: {
    onNativeAdLoaded: (ad) => {
      console.log('Headline:', ad.headline);
      console.log('Has video:', ad.hasVideoContent);
      // setState or update your list here
    },
    onAdFailedToLoad: (err) => {
      console.error(`Error ${err.code}: ${err.message}`);
    },
    onAdClicked: () => console.log('Clicked'),
    onAdImpression: () => console.log('Impression'),
  },
});

// Load a single ad
await loader.loadAd();

// Load multiple ads (up to 5, Google ads only — NOT for mediation)
await loader.loadAds(3);

// Always destroy when done — prevents memory leaks
loader.destroy();
```

> **Important:** Call `loader.destroy()` in your component's `useEffect` cleanup / `componentWillUnmount`. The `NativeAdView` and `useNativeAd` do this automatically.

---

## NativeAdOptions reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adChoicesPlacement` | `'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight'` | `'topRight'` | Position of the AdChoices icon |
| `mediaAspectRatio` | `'any' \| 'landscape' \| 'portrait' \| 'square' \| 'unknown'` | `'any'` | Preferred aspect ratio for media |
| `videoStartMuted` | `boolean` | `true` | Start video ads muted |
| `customControlsEnabled` | `boolean` | `false` | Show custom play/pause/mute controls |
| `requestMultipleImages` | `boolean` | `false` | Request multiple image assets |
| `requestCustomMuteThisAd` | `boolean` | `false` | Request custom mute-this-ad support |

---

## AdRequestOptions reference

| Option | Type | Description |
|--------|------|-------------|
| `keywords` | `string[]` | Targeting keywords |
| `contentUrl` | `string` | Content URL for contextual targeting |
| `requestNonPersonalizedAdsOnly` | `boolean` | Request non-personalized ads (for GDPR / privacy compliance) |
| `extras` | `Record<string, string>` | Mediation adapter extras |

---

## NativeAd object reference

All fields returned in `onAdLoaded`, `useNativeAd`, and `AdLoader` callbacks:

| Field | Type | Always present | Description |
|-------|------|---------------|-------------|
| `headline` | `string` | ✅ | Ad title / headline |
| `body` | `string \| null` | — | Ad body / description |
| `callToAction` | `string \| null` | — | CTA button label (e.g. "Install") |
| `advertiser` | `string \| null` | — | Advertiser / brand name |
| `store` | `string \| null` | — | App store name |
| `price` | `string \| null` | — | Price string (e.g. "Free", "$1.99") |
| `starRating` | `number \| null` | — | App star rating (0–5) |
| `icon` | `NativeAdImage \| null` | — | Icon asset `{ uri, scale }` |
| `images` | `NativeAdImage[] \| null` | — | Image assets |
| `hasVideoContent` | `boolean` | ✅ | Whether a video asset is available |
| `mediaContentAspectRatio` | `number \| null` | — | Width / height aspect ratio |
| `responseInfo` | `string \| null` | — | Debug info |

---

## NativeAdView props reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `adUnitId` | `string` | ✅ | Your AdMob ad unit ID |
| `renderAd` | `(ad: NativeAd) => ReactNode` | ✅ | Render function for the ad layout |
| `nativeAdOptions` | `NativeAdOptions` | — | Ad loading options |
| `adRequestOptions` | `AdRequestOptions` | — | Targeting / request options |
| `onAdLoaded` | `(ad: NativeAd) => void` | — | Called when ad loads |
| `onAdFailedToLoad` | `(err: AdError) => void` | — | Called on load failure |
| `onAdClicked` | `() => void` | — | Called when user taps the ad |
| `onAdImpression` | `() => void` | — | Called when impression is recorded |
| `onAdOpened` | `() => void` | — | Called when ad overlay opens |
| `onAdClosed` | `() => void` | — | Called when ad overlay closes |
| `loadingView` | `ReactNode` | — | Shown while ad is loading |
| `errorView` | `ReactNode` | — | Shown when ad fails to load |
| `refreshIntervalMs` | `number` | — | Auto-refresh interval in milliseconds |
| `refreshOnMount` | `boolean` | — | Load ad on mount (default: `true`) |
| `style` | `StyleProp<ViewStyle>` | — | Style for the outer container |

---

## NativeAdMediaView props reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `StyleProp<ViewStyle>` | — | View style |
| `resizeMode` | `'cover' \| 'contain' \| 'stretch' \| 'center'` | `'cover'` | How media is scaled |

---

## NativeAdAttribution props reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `'Ad'` | Badge label |
| `badgeColor` | `string` | `'#FFCC66'` | Badge background color |
| `textColor` | `string` | `'#333333'` | Badge text color |
| `style` | `StyleProp<ViewStyle>` | — | Badge container style |
| `textStyle` | `StyleProp<TextStyle>` | — | Badge text style |

---

## Important: Click handling

**Do not add `onPress` handlers to views inside `renderAd`.** Clicks on ad assets are handled automatically by the SDK as long as the views are registered inside `NativeAdView`.

From the AdMob docs:
> "Don't implement any custom click handlers on any views over or within the native ad view. Clicks on the ad view assets are handled by the SDK as long as you correctly populate and register the asset views."

---

## Best practices

Based on the [official AdMob best practices](https://developers.google.com/admob/android/native#best_practices):

1. **Always use test ads during development.** Using live ads in testing risks invalid activity on your account.
2. **Precache ads for lists.** Load ads before they scroll into view.
3. **Clear cache after one hour.** Stale ads reduce fill rate and revenue.
4. **Do not call `loadAd()` again while a load is in progress.** Wait for the callback before requesting another ad.
5. **Limit how many ads you cache.** Native ads have a large memory footprint. Only cache ads that are immediately visible.
6. **Always destroy ads when unmounting.** Call `loader.destroy()` in useEffect cleanup. `NativeAdView` and `useNativeAd` handle this automatically.
7. **Enable hardware acceleration** on all Activities that display video ads (enabled by default).

---

## AdChoices overlay

The AdChoices overlay is added automatically by the SDK to your `NativeAdView`. Leave space in your preferred corner (configured via `nativeAdOptions.adChoicesPlacement`) for the icon.

> "It's important that the AdChoices overlay be seen, so choose background colors and images appropriately."

---

## License

MIT
