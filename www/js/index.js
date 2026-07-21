document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // Give Cordova plugins a moment to attach to window object
    setTimeout(initAdMob, 1000);
}

async function initAdMob() {
    if (typeof admob !== 'undefined' && admob) {
        try {
            // Initialize AdMob Engine
            await admob.start();

            // 1. Setup & Show Banner Ad
            const banner = new admob.BannerAd({
                adUnitId: 'ca-app-pub-9275319584599936/4158202000',
                position: 'bottom'
            });
            await banner.show();

            // 2. Setup Interstitial Ad
            const interstitial = new admob.InterstitialAd({
                adUnitId: 'ca-app-pub-9275319584599936/8947494259'
            });
            await interstitial.load();
            await interstitial.show();

        } catch (error) {
            console.error('AdMob Initialization Error:', error);
        }
    } else {
        console.warn('AdMob plugin is not available on this device environment.');
    }
}
