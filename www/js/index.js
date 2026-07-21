document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // AdMob Setup
    if (window.admob) {
        // 1. Banner Ad
        const banner = new admob.BannerAd({
            adUnitId: 'ca-app-pub-9275319584599936/4158202000',
            position: 'bottom'
        });

        banner.show().catch(err => console.error('Banner Error:', err));

        // 2. Interstitial Ad
        const interstitial = new admob.InterstitialAd({
            adUnitId: 'ca-app-pub-9275319584599936/8947494259'
        });

        interstitial.load().then(() => {
            return interstitial.show();
        }).catch(err => console.error('Interstitial Error:', err));
    }
}
