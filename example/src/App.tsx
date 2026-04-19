/**
 * Example app demonstrating react-native-admob-native-ads.
 *
 * Shows three different integration patterns:
 *   1. NativeAdView component (recommended — most flexible)
 *   2. useNativeAd hook (headless data access)
 *   3. AdLoader class (imperative / advanced)
 *
 * Uses the official Google test ad unit IDs — safe to use during development.
 * Replace with your real ad unit IDs before publishing.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  NativeAdView,
  NativeAdMediaView,
  NativeAdAttribution,
  useNativeAd,
} from 'react-native-admob-native-ads';

// Official Google test ad unit IDs — always use these during development.
const TEST_AD_UNIT_ID =
  Platform.OS === 'android'
    ? 'ca-app-pub-3940256099942544/2247696110'   // Android test ID
    : 'ca-app-pub-3940256099942544/3986624511';  // iOS test ID

// ---------------------------------------------------------------------------
// Pattern 1 — NativeAdView component (recommended)
// ---------------------------------------------------------------------------

function ComponentPatternExample() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>1. NativeAdView Component</Text>
      <NativeAdView
        adUnitId={TEST_AD_UNIT_ID}
        nativeAdOptions={{
          adChoicesPlacement: 'topRight',
          mediaAspectRatio: 'landscape',
          videoStartMuted: true,
        }}
        adRequestOptions={{
          keywords: ['technology', 'apps'],
        }}
        onAdLoaded={(ad) => console.log('[Example] Ad loaded:', ad.headline)}
        onAdFailedToLoad={(err) =>
          console.error('[Example] Ad failed:', err.message)
        }
        onAdClicked={() => console.log('[Example] Ad clicked')}
        onAdImpression={() => console.log('[Example] Ad impression recorded')}
        renderAd={(ad) => <AdCard ad={ad} />}
        loadingView={
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#555" />
            <Text style={styles.loadingText}>Loading ad…</Text>
          </View>
        }
        errorView={
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Ad unavailable</Text>
          </View>
        }
        style={styles.adContainer}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pattern 2 — useNativeAd hook
// ---------------------------------------------------------------------------

function HookPatternExample() {
  const { ad, isLoading, error, refresh } = useNativeAd({
    adUnitId: TEST_AD_UNIT_ID,
    nativeAdOptions: { adChoicesPlacement: 'bottomRight' },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>2. useNativeAd Hook</Text>

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#555" />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error {error.code}: {error.message}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {ad && !isLoading && (
        <View style={styles.hookAdCard}>
          <NativeAdAttribution text="Sponsored" badgeColor="#4285F4" textColor="#fff" />
          <Text style={styles.hookHeadline}>{ad.headline}</Text>
          {ad.body ? <Text style={styles.hookBody}>{ad.body}</Text> : null}
          <View style={styles.hookMeta}>
            {ad.advertiser ? (
              <Text style={styles.hookAdvertiser}>{ad.advertiser}</Text>
            ) : null}
            {ad.starRating ? (
              <Text style={styles.hookRating}>★ {ad.starRating.toFixed(1)}</Text>
            ) : null}
          </View>
          {ad.callToAction ? (
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaText}>{ad.callToAction}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>↻ Load new ad</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared AdCard sub-component used by Pattern 1
// ---------------------------------------------------------------------------

function AdCard({ ad }: { ad: Parameters<NativeAdView['props']['renderAd']>[0] }) {
  return (
    <View style={styles.adCard}>
      {/* Required AdChoices attribution badge */}
      <View style={styles.adCardHeader}>
        {ad.icon ? (
          <Image source={{ uri: ad.icon.uri }} style={styles.adIcon} />
        ) : null}
        <View style={styles.adCardHeaderText}>
          <Text style={styles.headline} numberOfLines={2}>
            {ad.headline}
          </Text>
          {ad.advertiser ? (
            <Text style={styles.advertiser}>{ad.advertiser}</Text>
          ) : null}
        </View>
        <NativeAdAttribution />
      </View>

      {/* Main media (video or image) */}
      <NativeAdMediaView style={styles.mediaView} resizeMode="cover" />

      {/* Body text */}
      {ad.body ? (
        <Text style={styles.body} numberOfLines={3}>
          {ad.body}
        </Text>
      ) : null}

      {/* Bottom row: price / store / star rating / CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.metaGroup}>
          {ad.price ? (
            <Text style={styles.price}>{ad.price}</Text>
          ) : null}
          {ad.store ? (
            <Text style={styles.store}>{ad.store}</Text>
          ) : null}
          {ad.starRating ? (
            <Text style={styles.stars}>★ {ad.starRating.toFixed(1)}</Text>
          ) : null}
        </View>
        {ad.callToAction ? (
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{ad.callToAction}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------

export default function App() {
  const [activeTab, setActiveTab] = useState<'component' | 'hook'>('component');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AdMob Native Ads</Text>
        <Text style={styles.headerSub}>react-native-admob-native-ads</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'component' && styles.activeTab]}
          onPress={() => setActiveTab('component')}
        >
          <Text style={[styles.tabText, activeTab === 'component' && styles.activeTabText]}>
            Component
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hook' && styles.activeTab]}
          onPress={() => setActiveTab('hook')}
        >
          <Text style={[styles.tabText, activeTab === 'hook' && styles.activeTabText]}>
            Hook
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'component' ? (
          <ComponentPatternExample />
        ) : (
          <HookPatternExample />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#1A73E8' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#1A73E8', fontWeight: '700' },
  scroll: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Ad containers
  adContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  adCard: { padding: 12 },
  adCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  adCardHeaderText: { flex: 1, marginHorizontal: 8 },
  adIcon: { width: 40, height: 40, borderRadius: 8 },
  headline: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', lineHeight: 20 },
  advertiser: { fontSize: 12, color: '#666', marginTop: 2 },
  mediaView: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10, backgroundColor: '#EEE' },
  body: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 12, color: '#333', fontWeight: '600' },
  store: { fontSize: 12, color: '#666' },
  stars: { fontSize: 12, color: '#F4A020' },
  ctaButton: { backgroundColor: '#1A73E8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Loading / error states
  loadingBox: { height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12 },
  loadingText: { marginTop: 8, fontSize: 12, color: '#999' },
  errorBox: { padding: 16, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#FFD0D0' },
  errorText: { fontSize: 13, color: '#C00', textAlign: 'center' },
  retryButton: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#EEE', borderRadius: 16 },
  retryText: { fontSize: 13, color: '#333' },

  // Hook pattern card
  hookAdCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  hookHeadline: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 10, marginBottom: 6 },
  hookBody: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 10 },
  hookMeta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  hookAdvertiser: { fontSize: 12, color: '#666' },
  hookRating: { fontSize: 12, color: '#F4A020' },
  refreshButton: { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE' },
  refreshText: { fontSize: 13, color: '#1A73E8' },
});
