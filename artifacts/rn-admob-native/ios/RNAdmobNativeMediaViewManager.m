#import "RNAdmobNativeMediaViewManager.h"

#if __has_include(<GoogleMobileAds/GoogleMobileAds.h>)
#import <GoogleMobileAds/GoogleMobileAds.h>
#endif

@implementation RNAdmobNativeMediaViewManager

RCT_EXPORT_MODULE(RNAdmobNativeMediaView)

- (UIView *)view {
    GADMediaView *mediaView = [[GADMediaView alloc] init];
    mediaView.clipsToBounds = YES;
    mediaView.contentMode = UIViewContentModeScaleAspectFill;
    return mediaView;
}

RCT_CUSTOM_VIEW_PROPERTY(resizeMode, NSString, GADMediaView) {
    NSString *mode = json ? [RCTConvert NSString:json] : @"cover";
    if ([mode isEqualToString:@"contain"]) {
        view.contentMode = UIViewContentModeScaleAspectFit;
    } else if ([mode isEqualToString:@"stretch"]) {
        view.contentMode = UIViewContentModeScaleToFill;
    } else if ([mode isEqualToString:@"center"]) {
        view.contentMode = UIViewContentModeCenter;
    } else {
        view.contentMode = UIViewContentModeScaleAspectFill; // cover
    }
}

@end
