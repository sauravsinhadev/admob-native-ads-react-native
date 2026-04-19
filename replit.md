# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Packages

### react-native-admob-native-ads (`artifacts/rn-admob-native/`)

A complete React Native package for AdMob Native Ads with full customization, mirroring the official Google AdMob Android/iOS docs. Targets React Native 0.85+.

**Exports:**
- `NativeAdView` — top-level ad container component (mirrors Android NativeAdView / iOS GADNativeAdView)
- `NativeAdMediaView` — video/image media asset component (mirrors MediaView / GADMediaView)
- `NativeAdAttribution` — required "Ad" badge (AdMob policy compliance)
- `useNativeAd` — React hook for headless ad data access
- `AdLoader` — imperative class API mirroring Android AdLoader / iOS GADAdLoader
- Full TypeScript types for all props, options, callbacks, and the NativeAd object

**Native modules:**
- Android: `RNAdmobNativeModule` (bridge), `RNAdmobNativeViewManager` (NativeAdView), `RNAdmobNativeMediaViewManager` (MediaView)
- iOS: `RNAdmobNative` module + `RNAdmobNativeViewManager` + `RNAdmobNativeMediaViewManager`

**Key features:**
- NativeAdOptions: adChoicesPlacement, mediaAspectRatio, videoStartMuted, customControlsEnabled
- AdRequestOptions: keywords, contentUrl, requestNonPersonalizedAdsOnly
- Auto-refresh, multiple ad loading (loadAds up to 5), proper destroy() lifecycle
