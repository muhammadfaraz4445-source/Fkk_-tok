document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // Safe initialization check for AdMob
    setTimeout(initAdMob, 1000);
}

async function initAdMob() {
    if (typeof admob !== 'undefined' && admob) {
        try {
            // Start AdMob SDK
            await admob.start();

            // 1. Banner Ad
            const banner = new admob.BannerAd({
                adUnitId: 'ca-app-pub-9275319584599936/4158202000',
                position: 'bottom'
            });
            await banner.show();

            // 2. Interstitial Ad
            const interstitial = new admob.InterstitialAd({
                adUnitId: 'ca-app-pub-9275319584599936/8947494259'
            });
            await interstitial.load();
            await interstitial.show();

        } catch (error) {
            console.log('AdMob initialization error:', error);
        }
    } else {
        console.log('AdMob plugin is not available yet.');
    }
}
