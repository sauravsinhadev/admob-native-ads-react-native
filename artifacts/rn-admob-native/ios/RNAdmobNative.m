#import "RNAdmobNative.h"
#import <React/RCTUtils.h>
#import <React/RCTLog.h>

// Import the Google Mobile Ads SDK.
// The host app must add 'Google-Mobile-Ads-SDK' via CocoaPods.
#if __has_include(<GoogleMobileAds/GoogleMobileAds.h>)
#import <GoogleMobileAds/GoogleMobileAds.h>
#else
#warning "Google-Mobile-Ads-SDK not found. Run `pod install` and ensure the pod is in your Podfile."
#endif

@import UIKit;

/**
 * Loader state container — holds the active GADAdLoader and loaded ads
 * so they can be referenced by loaderId for destruction.
 */
@interface RNAdmobNativeLoader : NSObject <GADNativeAdLoaderDelegate, GADAdLoaderDelegate>
@property (nonatomic, copy)   NSString       *loaderId;
@property (nonatomic, strong) GADAdLoader    *adLoader;
@property (nonatomic, strong) NSMutableArray<GADNativeAd *> *loadedAds;
@property (nonatomic, copy)   RCTPromiseResolveBlock resolve;
@property (nonatomic, copy)   RCTPromiseRejectBlock  reject;
@property (nonatomic, assign) NSInteger requestedCount;
@property (nonatomic, assign) BOOL resolved;
@end

@implementation RNAdmobNativeLoader

- (instancetype)init {
    self = [super init];
    _loadedAds = [NSMutableArray array];
    _resolved  = NO;
    return self;
}

#pragma mark - GADNativeAdLoaderDelegate

- (void)adLoader:(GADAdLoader *)adLoader didReceiveNativeAd:(GADNativeAd *)nativeAd {
    [self.loadedAds addObject:nativeAd];
    // Resolve when all requested ads are in (or loader is done).
    if (!self.adLoader.isLoading && !self.resolved) {
        [self resolveWithAds];
    }
}

- (void)adLoader:(GADAdLoader *)adLoader didFailToReceiveAdWithError:(NSError *)error {
    if (!self.resolved) {
        self.resolved = YES;
        self.reject([@(error.code) stringValue], error.localizedDescription, error);
    }
}

- (void)adLoaderDidFinishLoading:(GADAdLoader *)adLoader {
    if (!self.resolved) {
        [self resolveWithAds];
    }
}

- (void)resolveWithAds {
    self.resolved = YES;
    NSMutableArray *serialized = [NSMutableArray array];
    for (GADNativeAd *ad in self.loadedAds) {
        [serialized addObject:[RNAdmobNativeLoader serializeAd:ad]];
    }
    NSDictionary *result = @{
        @"loaderId": self.loaderId,
        @"ads": serialized,
    };
    self.resolve(result);
}

#pragma mark - Serialization

+ (NSDictionary *)serializeAd:(GADNativeAd *)ad {
    NSMutableDictionary *map = [NSMutableDictionary dictionary];
    map[@"headline"]    = ad.headline ?: [NSNull null];
    map[@"body"]        = ad.body ?: [NSNull null];
    map[@"callToAction"]= ad.callToAction ?: [NSNull null];
    map[@"advertiser"]  = ad.advertiser ?: [NSNull null];
    map[@"store"]       = ad.store ?: [NSNull null];
    map[@"price"]       = ad.price ?: [NSNull null];
    map[@"starRating"]  = ad.starRating ?: [NSNull null];

    // Icon
    if (ad.icon && ad.icon.imageURL) {
        map[@"icon"] = @{
            @"uri":   ad.icon.imageURL.absoluteString,
            @"scale": @(ad.icon.scale),
        };
    } else {
        map[@"icon"] = [NSNull null];
    }

    // Images
    if (ad.images.count > 0) {
        NSMutableArray *images = [NSMutableArray array];
        for (GADNativeAdImage *img in ad.images) {
            if (img.imageURL) {
                [images addObject:@{
                    @"uri":   img.imageURL.absoluteString,
                    @"scale": @(img.scale),
                }];
            }
        }
        map[@"images"] = images;
    } else {
        map[@"images"] = [NSNull null];
    }

    // Media content
    BOOL hasVideo = ad.mediaContent != nil && ad.mediaContent.hasVideoContent;
    map[@"hasVideoContent"] = @(hasVideo);
    map[@"mediaContentAspectRatio"] = ad.mediaContent ? @(ad.mediaContent.aspectRatio) : @(0);
    map[@"responseInfo"] = ad.responseInfo ? ad.responseInfo.description : [NSNull null];

    return [map copy];
}

@end


#pragma mark - RNAdmobNative Module

@interface RNAdmobNative ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, RNAdmobNativeLoader *> *loaders;
@end

@implementation RNAdmobNative

RCT_EXPORT_MODULE(RNAdmobNative)

- (instancetype)init {
    self = [super init];
    _loaders = [NSMutableDictionary dictionary];
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

#pragma mark - loadNativeAd

RCT_EXPORT_METHOD(loadNativeAd:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSString *adUnitId = options[@"adUnitId"] ?: @"";
    NSDictionary *nativeAdOpts = options[@"nativeAdOptions"];

    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *loaderId = [[NSUUID UUID] UUIDString];
        GADAdLoader *loader = [[GADAdLoader alloc]
                               initWithAdUnitID:adUnitId
                               rootViewController:[UIApplication sharedApplication].keyWindow.rootViewController
                               adTypes:@[GADAdLoaderAdTypeNative]
                               options:[self buildNativeAdOptions:nativeAdOpts]];

        RNAdmobNativeLoader *state = [[RNAdmobNativeLoader alloc] init];
        state.loaderId      = loaderId;
        state.adLoader      = loader;
        state.resolve       = ^(id result) {
            // Unwrap single ad for loadNativeAd (mirrors Android API)
            NSDictionary *res = (NSDictionary *)result;
            NSArray *ads = res[@"ads"];
            if (ads.count > 0) {
                resolve(@{ @"loaderId": loaderId, @"ad": ads[0] });
            } else {
                reject(@"-1", @"No ad returned", nil);
            }
        };
        state.reject        = reject;
        state.requestedCount = 1;

        loader.delegate = state;
        self.loaders[loaderId] = state;

        GADRequest *request = [self buildAdRequest:options];
        [loader loadRequest:request];
    });
}

#pragma mark - loadNativeAds

RCT_EXPORT_METHOD(loadNativeAds:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSString *adUnitId = options[@"adUnitId"] ?: @"";
    NSInteger count = [options[@"count"] integerValue];
    NSInteger safeCount = MAX(1, MIN(count, 5));
    NSDictionary *nativeAdOpts = options[@"nativeAdOptions"];

    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *loaderId = [[NSUUID UUID] UUIDString];
        GADMultipleAdsAdLoaderOptions *multiOpts = [[GADMultipleAdsAdLoaderOptions alloc] init];
        multiOpts.numberOfAds = safeCount;

        NSMutableArray *allOptions = [NSMutableArray arrayWithObject:multiOpts];
        NSArray *nativeOptions = [self buildNativeAdOptions:nativeAdOpts];
        if (nativeOptions) [allOptions addObjectsFromArray:nativeOptions];

        GADAdLoader *loader = [[GADAdLoader alloc]
                               initWithAdUnitID:adUnitId
                               rootViewController:[UIApplication sharedApplication].keyWindow.rootViewController
                               adTypes:@[GADAdLoaderAdTypeNative]
                               options:allOptions];

        RNAdmobNativeLoader *state = [[RNAdmobNativeLoader alloc] init];
        state.loaderId       = loaderId;
        state.adLoader       = loader;
        state.resolve        = resolve;
        state.reject         = reject;
        state.requestedCount = safeCount;

        loader.delegate = state;
        self.loaders[loaderId] = state;

        GADRequest *request = [self buildAdRequest:options];
        [loader loadRequest:request];
    });
}

#pragma mark - destroyNativeAd

RCT_EXPORT_METHOD(destroyNativeAd:(NSDictionary *)options)
{
    NSString *loaderId = options[@"loaderId"];
    if (!loaderId) return;

    dispatch_async(dispatch_get_main_queue(), ^{
        RNAdmobNativeLoader *state = self.loaders[loaderId];
        if (state) {
            // GADNativeAd is destroyed by ARC when the reference is released.
            [state.loadedAds removeAllObjects];
            [self.loaders removeObjectForKey:loaderId];
        }
    });
}

#pragma mark - Helpers

- (GADRequest *)buildAdRequest:(NSDictionary *)options {
    GADRequest *request = [GADRequest request];
    NSDictionary *reqOpts = options[@"adRequestOptions"];
    if (reqOpts[@"contentUrl"]) {
        request.contentURL = reqOpts[@"contentUrl"];
    }
    return request;
}

- (NSArray<GADAdLoaderOptions *> *)buildNativeAdOptions:(NSDictionary *)opts {
    if (!opts) return @[];

    NSMutableArray *result = [NSMutableArray array];

    GADNativeAdViewAdOptions *viewOptions = [[GADNativeAdViewAdOptions alloc] init];
    NSString *placement = opts[@"adChoicesPlacement"];
    if ([placement isEqualToString:@"topLeft"]) {
        viewOptions.preferredAdChoicesPosition = GADAdChoicesPositionTopLeftCorner;
    } else if ([placement isEqualToString:@"bottomLeft"]) {
        viewOptions.preferredAdChoicesPosition = GADAdChoicesPositionBottomLeftCorner;
    } else if ([placement isEqualToString:@"bottomRight"]) {
        viewOptions.preferredAdChoicesPosition = GADAdChoicesPositionBottomRightCorner;
    } else {
        viewOptions.preferredAdChoicesPosition = GADAdChoicesPositionTopRightCorner;
    }
    [result addObject:viewOptions];

    GADNativeAdMediaAdLoaderOptions *mediaOptions = [[GADNativeAdMediaAdLoaderOptions alloc] init];
    NSString *ratio = opts[@"mediaAspectRatio"];
    if ([ratio isEqualToString:@"portrait"]) {
        mediaOptions.mediaAspectRatio = GADMediaAspectRatioPortrait;
    } else if ([ratio isEqualToString:@"landscape"]) {
        mediaOptions.mediaAspectRatio = GADMediaAspectRatioLandscape;
    } else if ([ratio isEqualToString:@"square"]) {
        mediaOptions.mediaAspectRatio = GADMediaAspectRatioSquare;
    } else {
        mediaOptions.mediaAspectRatio = GADMediaAspectRatioAny;
    }
    [result addObject:mediaOptions];

    GADNativeAdImageAdLoaderOptions *imageOptions = [[GADNativeAdImageAdLoaderOptions alloc] init];
    if ([opts[@"requestMultipleImages"] boolValue]) {
        imageOptions.disableImageLoading = NO;
    }
    [result addObject:imageOptions];

    GADVideoOptions *videoOptions = [[GADVideoOptions alloc] init];
    videoOptions.startMuted = opts[@"videoStartMuted"] ? [opts[@"videoStartMuted"] boolValue] : YES;
    videoOptions.customControlsRequested = [opts[@"customControlsEnabled"] boolValue];
    [result addObject:videoOptions];

    return [result copy];
}

@end
