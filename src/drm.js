// DRM Protection with Widevine and Dynamic Watermarking

export async function initDRM(videoElement, videoSrc) {
    // DRM Configuration for Widevine
    const config = [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
        audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }]
    }]

    try {
        // Check if EME (Encrypted Media Extensions) is supported
        if (!navigator.requestMediaKeySystemAccess) {
            console.warn('[DRM] EME not supported in this browser')
            // Fallback to regular video with enhanced watermarking
            addUserWatermark(videoElement)
            return false
        }

        // Request Widevine key system access
        const keySystemAccess = await navigator.requestMediaKeySystemAccess('com.widevine.alpha', config)
        const mediaKeys = await keySystemAccess.createMediaKeys()
        await videoElement.setMediaKeys(mediaKeys)

        console.log('[DRM] Widevine DRM initialized successfully')

        // Handle encrypted event
        videoElement.addEventListener('encrypted', async (e) => {
            console.log('[DRM] Encrypted content detected')
            const session = mediaKeys.createMediaKeySession('temporary')

            session.addEventListener('message', async (msgEvent) => {
                // In production, send to your license server
                // For now, we'll log the attempt
                console.log('[DRM] License request generated')

                // Example: Send to license server
                try {
                    const license = await fetch('/api/license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body: msgEvent.message
                    })

                    if (license.ok) {
                        const licenseData = await license.arrayBuffer()
                        await session.update(licenseData)
                        console.log('[DRM] License applied successfully')
                    }
                } catch (err) {
                    console.warn('[DRM] License server not configured:', err.message)
                }
            })

            await session.generateRequest(e.initDataType, e.initData)
        })

        // Add dynamic watermark overlay
        addUserWatermark(videoElement)

        // Load encrypted source if provided
        if (videoSrc) {
            videoElement.src = videoSrc
        }

        return true
    } catch (error) {
        console.warn('[DRM] DRM initialization failed:', error.message)
        // Fallback to enhanced watermarking
        addUserWatermark(videoElement)
        return false
    }
}

export function addUserWatermark(videoElement) {
    // Check if watermark already exists
    const existingWatermark = videoElement.parentElement?.querySelector('#video-watermark')
    if (existingWatermark) return

    const watermark = document.createElement('div')
    watermark.id = 'video-watermark'

    // Get user info
    const user = JSON.parse(localStorage.getItem('linksync_user') || '{}')
    const userId = user.username || 'Guest'
    const timestamp = new Date().toISOString()
    const sessionId = Math.random().toString(36).substr(2, 9)

    watermark.style.cssText = `
    position: absolute;
    top: 10%;
    left: 10%;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    pointer-events: none;
    z-index: 100;
    font-family: 'DM Sans', Arial, sans-serif;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: moveWatermark 15s infinite;
    user-select: none;
    mix-blend-mode: difference;
  `

    watermark.textContent = `${userId} | ${sessionId}`

    // Ensure parent has relative positioning
    if (videoElement.parentElement) {
        videoElement.parentElement.style.position = 'relative'
        videoElement.parentElement.appendChild(watermark)
    }

    // Update watermark position periodically
    setInterval(() => {
        const top = Math.random() * 80 + 10
        const left = Math.random() * 80 + 10
        watermark.style.top = `${top}%`
        watermark.style.left = `${left}%`
    }, 15000)

    // Add CSS animation
    if (!document.getElementById('watermark-animation')) {
        const style = document.createElement('style')
        style.id = 'watermark-animation'
        style.textContent = `
      @keyframes moveWatermark {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
        25% { transform: translate(20px, 30px) rotate(5deg); opacity: 0.6; }
        50% { transform: translate(-10px, 20px) rotate(-3deg); opacity: 0.5; }
        75% { transform: translate(15px, -15px) rotate(4deg); opacity: 0.7; }
        100% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
      }
    `
        document.head.appendChild(style)
    }

    console.log('[DRM] Dynamic watermark applied')
}

// Initialize DRM for all video elements
let drmObserver = null

export function initAllVideoDRM() {
    const videos = document.querySelectorAll('video')

    videos.forEach(video => {
        // Skip if already initialized
        if (video.dataset.drmInitialized) return
        video.dataset.drmInitialized = 'true'

        // Add watermark immediately
        addUserWatermark(video)

        // Initialize DRM when video loads
        video.addEventListener('loadedmetadata', () => {
            console.log('[DRM] Video loaded, watermark active')
        }, { once: true })
    })

    // Watch for new video elements - only create the observer once
    if (!drmObserver) {
        drmObserver = new MutationObserver((mutations) => {
            // Check if any added nodes are videos or contain videos
            const hasNewVideos = mutations.some(mutation =>
                Array.from(mutation.addedNodes).some(node =>
                    node.nodeName === 'VIDEO' || (node.querySelectorAll && node.querySelectorAll('video').length > 0)
                )
            )

            if (hasNewVideos) {
                initAllVideoDRM()
            }
        })

        drmObserver.observe(document.body, {
            childList: true,
            subtree: true
        })
    }
}

// Prevent video download
export function preventVideoDownload() {
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'VIDEO') {
            e.preventDefault()
            console.warn('[DRM] Video download attempt blocked')
            return false
        }
    })

    // Prevent video source inspection
    const originalGetAttribute = HTMLVideoElement.prototype.getAttribute
    HTMLVideoElement.prototype.getAttribute = function (attr) {
        if (attr === 'src' && this.dataset.protected === 'true') {
            console.warn('[DRM] Video source access blocked')
            return null
        }
        return originalGetAttribute.call(this, attr)
    }
}
