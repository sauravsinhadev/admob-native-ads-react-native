#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RNAdmobNative — iOS native module bridging the Google Mobile Ads SDK
 * GADAdLoader to JavaScript.
 *
 * Handles loading native ads, serializing ad assets to NSDictionary,
 * and managing ad lifecycle (destroy) to prevent memory leaks.
 */
@interface RNAdmobNative : NSObject <RCTBridgeModule>
@end

NS_ASSUME_NONNULL_END
