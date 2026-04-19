import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeAdAttributionProps } from '../types';

/**
 * NativeAdAttribution renders the required "Ad" badge that must be displayed
 * with every native ad to comply with AdMob policy.
 *
 * Per Google policy:
 * > "You must display an ad attribution to denote that the view is an advertisement."
 * > https://support.google.com/admob/answer/6329638#ad-attribution
 *
 * Place this inside your `NativeAdView` renderAd function, typically in a
 * corner overlapping the media view or headline area.
 *
 * @example
 * ```tsx
 * <NativeAdView
 *   adUnitId="..."
 *   renderAd={(ad) => (
 *     <View>
 *       <NativeAdAttribution text="Sponsored" badgeColor="#FFD700" textColor="#000" />
 *       <Text>{ad.headline}</Text>
 *     </View>
 *   )}
 * />
 * ```
 */
export function NativeAdAttribution({
  text = 'Ad',
  style,
  textStyle,
  badgeColor = '#FFCC66',
  textColor = '#333333',
}: NativeAdAttributionProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: textColor },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
