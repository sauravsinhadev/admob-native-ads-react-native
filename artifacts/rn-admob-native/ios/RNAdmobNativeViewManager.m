#import "RNAdmobNativeViewManager.h"
#import <React/RCTUIManager.h>

#if __has_include(<GoogleMobileAds/GoogleMobileAds.h>)
#import <GoogleMobileAds/GoogleMobileAds.h>
#endif

@implementation RNAdmobNativeViewManager

RCT_EXPORT_MODULE(RNAdmobNativeView)

- (UIView *)view {
    GADNativeAdView *adView = [[GADNativeAdView alloc] init];
    adView.clipsToBounds = YES;
    return adView;
}

RCT_EXPORT_VIEW_PROPERTY(adUnitId, NSString)

@end
