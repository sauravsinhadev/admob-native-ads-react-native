#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RNAdmobNativeMediaViewManager — View manager for the GADMediaView (iOS).
 *
 * GADMediaView displays the main visual asset of a native ad:
 *   - Video if available (buffered and auto-played).
 *   - Main image if no video is present.
 *
 * Must be placed inside RNAdmobNativeView in the native hierarchy.
 */
@interface RNAdmobNativeMediaViewManager : RCTViewManager
@end

NS_ASSUME_NONNULL_END
