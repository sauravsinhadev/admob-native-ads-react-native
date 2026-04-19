#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RNAdmobNativeViewManager — View manager for the GADNativeAdView container (iOS).
 *
 * Wraps GADNativeAdView so that asset child views are registered with the SDK,
 * enabling automatic click tracking, impression recording, and AdChoices overlay.
 */
@interface RNAdmobNativeViewManager : RCTViewManager
@end

NS_ASSUME_NONNULL_END
