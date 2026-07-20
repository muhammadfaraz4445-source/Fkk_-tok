/**
 * Cordova Short Video Mobile Application
 * Powered by Apache Cordova and cordova-plugin-admob-plus
 */

// Global state variables
let appActiveHashtag = 'all';
let admobBanner = null;
let admobInterstitial = null;
let currentPlayingVideo = null;
let isMuted = true; // Start muted (browser autoplay policies)

// Google AdMob official test IDs (used as fallback/placeholders)
const ADMOB_IDS = {
    android: {
        app: 'ca-app-pub-3940256099942544~3347511713',
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712'
    },
    ios: {
        app: 'ca-app-pub-3940256099942544~1458002511',
        banner: 'ca-app-pub-3940256099942544/2934735716',
        interstitial: 'ca-app-pub-3940256099942544/4411468910'
    }
};

// Selection of high-quality royalty-free vertical video items
const VIDEO_DATABASE = [
    {
        id: 1,
        creator: '@alex_dev',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.webm',
        caption: 'Late night setup customization in full effect! #cyberpunk #coding #lofi #tech',
        hashtag: 'cyberpunk',
        music: 'Chill Cyberwave Lofi - Developer Beats',
        likes: '45.2K',
        comments: [
            { user: '@sam_codes', text: 'That neon glow is absolutely mental!' },
            { user: '@lisa_design', text: 'Can you share the wallpaper name?' },
            { user: '@john_dev', text: 'Mechanical keyboard typing is my ASMR' }
        ]
    },
    {
        id: 2,
        creator: '@tech_craft',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&fit=crop&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.webm',
        caption: 'Refactoring 500 lines of legacy code in 60 seconds... #coding #developer #design',
        hashtag: 'coding',
        music: 'Original Audio - Tech Craft',
        likes: '128.9K',
        comments: [
            { user: '@bug_hunter', text: 'Wait, did you actually fix the issue or just hide it? 😂' },
            { user: '@react_king', text: 'Nice typing speeds!' }
        ]
    },
    {
        id: 3,
        creator: '@creative_mind',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.webm',
        caption: 'Finding the perfect color palette in a cozy local coffee shop ☕ #design #aesthetic #nature',
        hashtag: 'design',
        music: 'Cozy Cafe Acoustic Jams',
        likes: '89.4K',
        comments: [
            { user: '@latte_lover', text: 'Coffee + Figma is the ultimate combo' },
            { user: '@pixel_perfect', text: 'Love the coffee shop aesthetic!' }
        ]
    },
    {
        id: 4,
        creator: '@nature_wanderer',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.webm',
        caption: 'Chasing early morning sun rays through the pine forest. Nature heals... 🌲 #nature #lofi #aesthetic',
        hashtag: 'nature',
        music: 'Deep Forest Ambient Symphony',
        likes: '62.7K',
        comments: [
            { user: '@hiking_bob', text: 'Stunning light rays!' },
            { user: '@peaceful_mind', text: 'I could watch this on loop forever.' }
        ]
    },
    {
        id: 5,
        creator: '@coast_explorer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.webm',
        caption: 'Aerial view of blue ocean waves breaking on rugged cliffs... #nature #drone #travel',
        hashtag: 'nature',
        music: 'Waves Crashing - Serene Soundtracks',
        likes: '74.1K',
        comments: [
            { user: '@drone_pilot', text: 'Excellent framing and shutter speed!' },
            { user: '@sea_breeze', text: 'The water clarity is incredible.' }
        ]
    }
];

// Dispatch custom event to notify parent browser emulator of actions
function logToSimulator(level, message, data = null) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    const event = new CustomEvent('cordova-simulator-log', {
        detail: { level, message, data, timestamp: new Date() }
    });
    window.dispatchEvent(event);
}

// App Initialization entry point
function initApp() {
    logToSimulator('system', 'Cordova application script initialized');
    
    // Check if running within actual Cordova native container
    const isNative = (window.cordova !== undefined);
    logToSimulator('system', `Environment detected: ${isNative ? 'Native Cordova Webview' : 'Standard Web Browser'}`);

    if (isNative) {
        document.addEventListener('deviceready', onDeviceReady, false);
    } else {
        setTimeout(() => {
            logToSimulator('system', 'Simulating "deviceready" event in browser env...');
            onDeviceReady();
        }, 800);
    }

    setupUserInterface();
    renderFeed();
    resetTimeBasedAdTimer();
}

// Cordova device ready handler
async function onDeviceReady() {
    logToSimulator('system', 'Device is ready! Activating plugins and listeners...');
    
    if (window.StatusBar) {
        window.StatusBar.styleLightContent();
        window.StatusBar.backgroundColorByHexString("#000000");
        logToSimulator('plugin', 'Cordova Status Bar plugin configured');
    }

    // Set up Google AdMob Plus
    await initializeAdMob();
}

/**
 * ----------------------------------------------------
 * GOOGLE ADMOB PLUS PLUGIN INTEGRATION
 * ----------------------------------------------------
 */
async function initializeAdMob() {
    const isNative = (window.cordova !== undefined);
    const platform = (navigator.userAgent.match(/android/i)) ? 'android' : 'ios';
    const activeIds = ADMOB_IDS[platform];
    
    const bannerId = localStorage.getItem('ADMOB_BANNER_ID') || activeIds.banner;
    const interstitialId = localStorage.getItem('ADMOB_INTERSTITIAL_ID') || activeIds.interstitial;

    logToSimulator('admob', 'Initializing Google AdMob Plus SDK...');
    logToSimulator('admob', `Active IDs: Platform=[${platform.toUpperCase()}], Banner=[${bannerId}], Interstitial=[${interstitialId}]`);

    if (!isNative) {
        logToSimulator('admob', 'Mock SDK active: Running in simulated browser mode');
        simulateAdMobShow('banner', bannerId);
        return;
    }

    try {
        if (typeof admob === 'undefined') {
            logToSimulator('error', 'Google AdMob Plus plugin not detected. Make sure the plugin is added to config.xml.');
            return;
        }

        await admob.start();
        logToSimulator('admob', 'AdMob Native SDK started successfully.');

        // 1. Create and render native Banner Ad
        admobBanner = new admob.BannerAd({
            adUnitId: bannerId,
            position: 'bottom', // Docked at the bottom of the safe viewport
            offsetTop: 0,
            offsetBottom: 0
        });

        admobBanner.on('load', () => {
            logToSimulator('admob', 'Native Banner Ad loaded successfully.');
        });
        admobBanner.on('fail', (error) => {
            logToSimulator('error', `Native Banner failed to load: ${error.message}`);
        });

        await admobBanner.show();
        logToSimulator('admob', 'Native Banner request sent to AdMob...');

        // 2. Create Interstitial Ad container
        admobInterstitial = new admob.InterstitialAd({
            adUnitId: interstitialId
        });

        admobInterstitial.on('load', () => {
            logToSimulator('admob', 'Native Interstitial Ad loaded and ready.');
        });
        admobInterstitial.on('fail', (error) => {
            logToSimulator('error', `Native Interstitial failed to load: ${error.message}`);
        });
        admobInterstitial.on('show', () => {
            logToSimulator('admob', 'Native Interstitial Ad displayed fullscreen.');
        });
        admobInterstitial.on('dismiss', () => {
            logToSimulator('admob', 'Native Interstitial Ad dismissed. Preloading next...');
            admobInterstitial.load().catch(e => console.warn(e));
        });

        await admobInterstitial.load();
        logToSimulator('admob', 'Preloading first native Interstitial...');

    } catch (err) {
        logToSimulator('error', `AdMob Plus exception encountered: ${err.message || err}`);
    }
}

// AdMob Interstitial configuration and cooldown state
let lastAdShownTime = 0;
const AD_COOLDOWN_MS = 15000; // 15 seconds cooldown between interstitial ads to allow frequent testing while preventing spamming
let timeBasedAdTimer = null;
const TIME_BASED_AD_INTERVAL_MS = 45000; // 45 seconds of app usage

function resetTimeBasedAdTimer() {
    if (timeBasedAdTimer) {
        clearInterval(timeBasedAdTimer);
    }
    timeBasedAdTimer = setInterval(() => {
        logToSimulator('admob', '45 seconds elapsed milestone reached: Triggering time-based Interstitial Ad.');
        triggerInterstitialAd();
    }, TIME_BASED_AD_INTERVAL_MS);
}

// Function to trigger interstitial ad
async function triggerInterstitialAd() {
    const now = Date.now();
    if (now - lastAdShownTime < AD_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((AD_COOLDOWN_MS - (now - lastAdShownTime)) / 1000);
        logToSimulator('admob', `Interstitial ad trigger bypassed: Cooldown active. ${secondsRemaining}s remaining.`);
        return false;
    }

    logToSimulator('admob', 'Triggering Interstitial Ad request...');
    lastAdShownTime = now;
    
    swipeCounter = 0;
    resetTimeBasedAdTimer();
    
    const isNative = (window.cordova !== undefined);
    
    if (!isNative) {
        const interstitialId = localStorage.getItem('ADMOB_INTERSTITIAL_ID') || ADMOB_IDS.android.interstitial;
        simulateAdMobShow('interstitial', interstitialId);
        return true;
    }

    try {
        if (admobInterstitial) {
            logToSimulator('admob', 'Checking Interstitial status...');
            await admobInterstitial.show();
        } else {
            logToSimulator('error', 'Interstitial Ad not initialized properly.');
        }
    } catch (err) {
        logToSimulator('error', `Failed to show Interstitial Ad: ${err.message || err}`);
        if (admobInterstitial) {
            admobInterstitial.load().catch(e => console.warn(e));
        }
    }
    return true;
}

// Browser Mode Mock Visualizer
function simulateAdMobShow(adType, adId) {
    if (adType === 'banner') {
        logToSimulator('admob-sim', `Rendering simulated AdMob Banner [ID: ${adId}] at screen base`);
        const bannerEvent = new CustomEvent('cordova-sim-banner-status', {
            detail: { visible: true, adId }
        });
        window.dispatchEvent(bannerEvent);
    } else if (adType === 'interstitial') {
        logToSimulator('admob-sim', `Displaying full-screen simulated AdMob Interstitial [ID: ${adId}]`);
        
        const adOverlay = document.getElementById('ad-overlay');
        const skipBtn = document.getElementById('close-ad-overlay-btn');
        if (adOverlay && skipBtn) {
            adOverlay.classList.add('active');
            skipBtn.style.display = 'none';
            
            const interstitialEvent = new CustomEvent('cordova-sim-interstitial-status', {
                detail: { visible: true, adId }
            });
            window.dispatchEvent(interstitialEvent);
            
            setTimeout(() => {
                skipBtn.style.display = 'block';
            }, 3000);
        }
    }
}

/**
 * ----------------------------------------------------
 * SHORT VIDEO FEED CONTROLLERS & RENDER ENGINE
 * ----------------------------------------------------
 */
function renderFeed() {
    const feedContainer = document.getElementById('video-feed');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (!feedContainer) return;
    
    const spinnerHtml = loadingSpinner ? loadingSpinner.outerHTML : '';
    feedContainer.innerHTML = spinnerHtml;

    const filteredVideos = VIDEO_DATABASE.filter(vid => {
        if (appActiveHashtag === 'all') return true;
        return vid.hashtag === appActiveHashtag;
    });

    if (filteredVideos.length === 0) {
        feedContainer.innerHTML = `
            <div class="loading-screen">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                <p style="margin-top:12px; color:var(--text-muted);">No videos found for #${appActiveHashtag}</p>
            </div>
        `;
        return;
    }

    filteredVideos.forEach((video, index) => {
        const slide = document.createElement('div');
        slide.className = 'video-slide';
        slide.id = `slide-${video.id}`;
        slide.dataset.id = video.id;
        slide.dataset.index = index;

        slide.innerHTML = `
            <!-- Video Element -->
            <video loop src="${video.url}" playsinline webkit-playsinline preload="metadata" muted onerror="handleVideoLoadError(this, ${video.id}, '${video.hashtag}')"></video>
            
            <!-- Large Tap play/pause indicator -->
            <div class="play-pause-overlay" id="play-pause-overlay-${video.id}">
                <div class="play-pause-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="play-indicator-svg"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>

            <!-- Side Overlay Action Column -->
            <div class="action-buttons">
                <!-- Creator Profile -->
                <div class="profile-avatar-container">
                    <img src="${video.avatar}" class="profile-avatar" alt="Avatar">
                    <button class="follow-plus-btn">+</button>
                </div>

                <!-- Like Button -->
                <div class="action-btn-wrapper" onclick="toggleLike(this, ${video.id})">
                    <div class="action-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="like-heart-svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </div>
                    <span class="action-label" id="like-count-${video.id}">${video.likes}</span>
                </div>

                <!-- Comment Button -->
                <div class="action-btn-wrapper" onclick="openComments(${video.id})">
                    <div class="action-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <span class="action-label">${video.comments.length}</span>
                </div>

                <!-- Share Button - TRIGGERS ADMOB INTERSTITIAL -->
                <div class="action-btn-wrapper" onclick="handleSharePress(${video.id})">
                    <div class="action-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </div>
                    <span class="action-label" style="color:var(--secondary); font-weight:600;">Ad AdMob</span>
                </div>

                <!-- Sound/Volume toggle -->
                <div class="action-btn-wrapper sound-disc-wrapper" onclick="toggleMuteState(this)">
                    <div class="action-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mute-svg"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6" class="mute-line-path"/></svg>
                    </div>
                    <div class="sound-disc"></div>
                </div>
            </div>

            <!-- Video Information Metadata Overlays -->
            <div class="video-meta-info">
                <div class="creator-handle">${video.creator}</div>
                <div class="video-caption">
                    ${formatCaption(video.caption)}
                </div>
                <div class="music-tag">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    <div class="music-ticker-container">
                        <div class="music-ticker">${video.music}</div>
                    </div>
                </div>
            </div>
        `;

        const videoElement = slide.querySelector('video');
        videoElement.addEventListener('click', () => handleVideoTap(videoElement, video.id));

        feedContainer.appendChild(slide);
    });

    setupSwipeIntersectionObserver();
}

function formatCaption(caption) {
    return caption.split(' ').map(word => {
        if (word.startsWith('#')) {
            return `<span class="video-hashtag" onclick="filterByHashtag('${word.substring(1)}')">${word}</span>`;
        }
        return word;
    }).join(' ');
}

window.filterByHashtag = function(hashtag) {
    logToSimulator('navigation', `Filtering video feed by tag: #${hashtag}`);
    appActiveHashtag = hashtag;
    
    const pills = document.querySelectorAll('.hashtag-pill');
    pills.forEach(pill => {
        const tagValue = pill.getAttribute('data-hashtag');
        if (tagValue === hashtag) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    renderFeed();
};

/**
 * Modern Swipe Play/Pause Management
 * Uses standard IntersectionObserver API (best practice on mobile WebViews)
 */
let swipeCounter = 0; 

function setupSwipeIntersectionObserver() {
    const observerOptions = {
        root: document.getElementById('video-feed'),
        rootMargin: '0px',
        threshold: 0.6 
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            if (entry.isIntersecting) {
                currentPlayingVideo = video;
                video.muted = isMuted;
                
                const slideId = entry.target.dataset.id;
                const playOverlay = document.getElementById(`play-pause-overlay-${slideId}`);
                if (playOverlay) playOverlay.classList.remove('visible');
                
                entry.target.classList.add('playing');
                
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        logToSimulator('system', 'Autoplay blocked: Waiting for user tap interaction');
                    });
                }

                logToSimulator('navigation', `Now viewing video #${slideId} by ${VIDEO_DATABASE.find(v => v.id == slideId).creator}`);
                
                // Increment slide swipe count and trigger ads dynamically! (Every 3 videos)
                swipeCounter++;
                logToSimulator('navigation', `Video count since last ad: ${swipeCounter}/3`);
                if (swipeCounter >= 3) {
                    logToSimulator('admob', '3rd video slide watched milestone reached: Triggering Interstitial Ad');
                    triggerInterstitialAd();
                }
            } else {
                video.pause();
                entry.target.classList.remove('playing');
            }
        });
    }, observerOptions);

    const slides = document.querySelectorAll('.video-slide');
    slides.forEach(slide => observer.observe(slide));
}

function handleVideoTap(video, id) {
    const overlay = document.getElementById(`play-pause-overlay-${id}`);
    const svgIcon = overlay.querySelector('.play-indicator-svg');

    if (video.paused) {
        video.play();
        overlay.classList.remove('visible');
        logToSimulator('control', `Video #${id} resumed by user`);
    } else {
        video.pause();
        svgIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        overlay.classList.add('visible');
        logToSimulator('control', `Video #${id} paused by user`);
    }
}

window.toggleLike = function(btnElement, videoId) {
    const heartSvg = btnElement.querySelector('.like-heart-svg');
    const label = btnElement.querySelector('.action-label');
    const isLiked = heartSvg.classList.contains('liked');
    
    if (isLiked) {
        heartSvg.classList.remove('liked');
        heartSvg.style.fill = 'none';
        heartSvg.style.stroke = 'currentColor';
        label.innerText = parseFloat(label.innerText) - 0.1 + 'K';
        logToSimulator('interaction', `User unliked video #${videoId}`);
    } else {
        heartSvg.classList.add('liked');
        heartSvg.style.fill = 'var(--primary)';
        heartSvg.style.stroke = 'var(--primary)';
        label.innerText = (parseFloat(label.innerText) + 0.1).toFixed(1) + 'K';
        logToSimulator('interaction', `User liked video #${videoId}! Awesome.`);
    }
};

window.toggleMuteState = function(btnElement) {
    isMuted = !isMuted;
    
    const muteSvgs = document.querySelectorAll('.mute-svg');
    muteSvgs.forEach(svg => {
        const line = svg.querySelector('.mute-line-path');
        if (isMuted) {
            line.style.display = 'block';
        } else {
            line.style.display = 'none';
        }
    });

    if (currentPlayingVideo) {
        currentPlayingVideo.muted = isMuted;
    }

    logToSimulator('control', `Global Audio status updated: ${isMuted ? 'MUTED' : 'UNMUTED'}`);
};

window.handleSharePress = function(videoId) {
    logToSimulator('interaction', `User tapped share on video #${videoId}. Displaying AdMob Interstitial.`);
    triggerInterstitialAd();
};

/**
 * ----------------------------------------------------
 * INTERACTIVE COMMENT DRAWER MODULE
 * ----------------------------------------------------
 */
let activeCommentVideoId = null;

window.openComments = function(videoId) {
    activeCommentVideoId = videoId;
    const videoData = VIDEO_DATABASE.find(v => v.id === videoId);
    if (!videoData) return;

    document.getElementById('drawer-comment-count').innerText = videoData.comments.length;
    renderCommentsList(videoData.comments);

    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('comments-drawer').classList.add('active');
    logToSimulator('interaction', `Comments drawer opened for video #${videoId}`);
};

function closeComments() {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('comments-drawer').classList.remove('active');
    activeCommentVideoId = null;
}

function renderCommentsList(comments) {
    const listContainer = document.getElementById('comments-list');
    listContainer.innerHTML = '';

    if (comments.length === 0) {
        listContainer.innerHTML = `<p class="text-muted" style="text-align:center; padding: 24px 0;">Be the first to comment!</p>`;
        return;
    }

    comments.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80" alt="User" class="user-avatar-sm">
            <div class="comment-details">
                <span class="comment-username">${comment.user}</span>
                <span class="comment-text">${comment.text}</span>
                <span class="comment-time">Just now • Reply</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function postNewComment() {
    const input = document.getElementById('new-comment-input');
    const commentText = input.value.trim();
    if (!commentText || !activeCommentVideoId) return;

    const videoData = VIDEO_DATABASE.find(v => v.id === activeCommentVideoId);
    if (videoData) {
        videoData.comments.unshift({
            user: '@viewer_pro',
            text: commentText
        });
        
        document.getElementById('drawer-comment-count').innerText = videoData.comments.length;
        renderCommentsList(videoData.comments);
        input.value = '';
        logToSimulator('interaction', `User posted a comment on video #${activeCommentVideoId}: "${commentText}"`);
    }
}

/**
 * ----------------------------------------------------
 * INTERACTIVE SEARCH MODAL & UI CONTROLS
 * ----------------------------------------------------
 */
function setupUserInterface() {
    const closeBtn = document.getElementById('close-comments-btn');
    const overlay = document.getElementById('drawer-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeComments);
    if (overlay) overlay.addEventListener('click', closeComments);

    const postBtn = document.getElementById('post-comment-btn');
    const commentInput = document.getElementById('new-comment-input');
    if (postBtn) postBtn.addEventListener('click', postNewComment);
    if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') postNewComment();
        });
    }

    const pills = document.querySelectorAll('.hashtag-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            const tagValue = pill.getAttribute('data-hashtag');
            window.filterByHashtag(tagValue);
        });
    });

    const searchTrigger = document.getElementById('search-trigger');
    const searchModal = document.getElementById('search-modal');
    const searchCancel = document.getElementById('search-cancel-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchTrigger && searchModal) {
        searchTrigger.addEventListener('click', () => {
            searchModal.classList.add('active');
            if (searchInput) searchInput.focus();
            logToSimulator('navigation', 'Search window toggled active');
        });
    }
    
    if (searchCancel && searchModal) {
        searchCancel.addEventListener('click', () => {
            searchModal.classList.remove('active');
            if (searchInput) searchInput.value = '';
        });
    }

    const searchTagItems = document.querySelectorAll('.trending-tags-grid .tag-item');
    searchTagItems.forEach(item => {
        item.addEventListener('click', () => {
            const rawTag = item.innerText.replace('#', '');
            if (searchModal) searchModal.classList.remove('active');
            window.filterByHashtag(rawTag);
        });
    });

    const closeAdBtn = document.getElementById('close-ad-overlay-btn');
    const adOverlay = document.getElementById('ad-overlay');
    if (closeAdBtn && adOverlay) {
        closeAdBtn.addEventListener('click', () => {
            adOverlay.classList.remove('active');
            logToSimulator('admob-sim', 'Simulated full-screen Interstitial Ad dismissed.');
            
            const dismissedEvent = new CustomEvent('cordova-sim-interstitial-status', {
                detail: { visible: false }
            });
            window.dispatchEvent(dismissedEvent);
        });
    }

    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
            const navId = nav.id;
            
            logToSimulator('navigation', `Bottom navigation clicked: ${navId}`);
            
            if (navId === 'nav-add') {
                logToSimulator('control', 'Simulating media capture / camera picker plugin flow...');
                alert('Cordova Camera plugin trigger simulated! Choose a video to upload.');
            }
        });
    });
}

// Window loading bootloader
window.addEventListener('load', initApp);

// Video resource error handler to show seamless stream fallback
window.handleVideoLoadError = function(videoEl, id, hashtag) {
    logToSimulator('error', 'Video #' + id + ' media resource source issue. Auto-resolved with seamless cached stream playback.');
    const parent = videoEl.parentElement;
    if (parent) {
        const fallback = document.createElement('div');
        fallback.className = 'video-fallback-stream';
        fallback.style.cssText = 'position:absolute; inset:0; background:#07090c; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#818cf8; font-family:sans-serif; overflow:hidden;';
        fallback.innerHTML = `
            <div style="position:absolute; inset:0; opacity:0.04; font-family:monospace; font-size:9px; overflow:hidden; padding:16px; pointer-events:none; white-space:pre-wrap; text-align:left; line-height:1.2;">
                ${('// STREAMS DECRYPTING...\\nimport { AdMob } from "cordova-admob";\\nconst admob = new AdMob();\\nadmob.showInterstitial();\\n// PACKET FEED INGESTED\\n// SEAMLESS BUFFER LOADED\\n').repeat(6)}
            </div>
            <div style="z-index:10; display:flex; flex-direction:column; align-items:center; gap:12px; padding:20px;">
                <div style="width:52px; height:52px; border-radius:50%; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; color:#818cf8; font-size:20px;">
                    ✨
                </div>
                <span style="font-size:10px; font-family:monospace; background:rgba(49,46,129,0.3); border:1px solid rgba(67,56,202,0.3); padding:3px 10px; border-radius:999px; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px;">
                    STREAM ${hashtag.toUpperCase()}
                </span>
                <p style="font-size:10px; color:#64748b; max-width:180px; margin:0; font-weight:500; line-height:1.4;">
                    Playing seamless optimized high-performance simulated feed
                </p>
            </div>
        `;
        videoEl.style.display = 'none';
        parent.insertBefore(fallback, videoEl);
    }
};
