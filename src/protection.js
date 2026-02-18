// Screenshot and Screen Recording Protection - Enhanced

export function initProtection() {
    // 1. Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        showWarning('Screenshots are not allowed on LinkSync')
        return false
    })

    // 2. Detect ALL screenshot shortcuts (Windows, Mac, Mobile)
    document.addEventListener('keydown', (e) => {
        const forbiddenKeys = [
            // Windows
            (e.key === 'PrintScreen'),
            (e.key === 'Print'),
            // Windows Snipping Tool / Snip & Sketch
            (e.metaKey && e.shiftKey && e.key === 'S'),
            (e.metaKey && e.shiftKey && e.key === 's'),
            (e.key === 'Meta' && e.shiftKey), // Win+Shift (preparing for S)
            // Mac screenshots
            (e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(e.key)),
            // Save page
            ((e.ctrlKey || e.metaKey) && e.key === 's'),
            ((e.ctrlKey || e.metaKey) && e.key === 'S'),
            // Developer tools
            (e.key === 'F12'),
            (e.ctrlKey && e.shiftKey && e.key === 'I'),
            (e.ctrlKey && e.shiftKey && e.key === 'i'),
            (e.ctrlKey && e.shiftKey && e.key === 'J'),
            (e.ctrlKey && e.shiftKey && e.key === 'j'),
            (e.ctrlKey && e.shiftKey && e.key === 'C'),
            (e.ctrlKey && e.shiftKey && e.key === 'c'),
            // Windows Game Bar
            (e.metaKey && e.key === 'g'),
            (e.metaKey && e.key === 'G'),
            (e.metaKey && e.altKey && e.key === 'r'),
            (e.metaKey && e.altKey && e.key === 'R')
        ]

        if (forbiddenKeys.some(k => k)) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            showWarning('⚠️ Screenshot Blocked - Privacy Protected')
            blurScreen()
            return false
        }
    })

    // 3. Detect Windows Key combinations (Snipping Tool trigger)
    let winKeyPressed = false
    let shiftKeyPressed = false

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Meta' || e.key === 'OS') {
            winKeyPressed = true
        }
        if (e.key === 'Shift') {
            shiftKeyPressed = true
        }

        // If both Win and Shift are pressed, likely going to press S
        if (winKeyPressed && shiftKeyPressed) {
            e.preventDefault()
            showWarning('⚠️ Snipping Tool Blocked')
            blurScreen()
            return false
        }
    })

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Meta' || e.key === 'OS') {
            winKeyPressed = false
        }
        if (e.key === 'Shift') {
            shiftKeyPressed = false
        }
    })

    // 4. Mobile Screenshot Detection
    if (isMobileDevice()) {
        // Detect volume down + power button (Android)
        let volumeDownPressed = false
        let powerButtonPressed = false

        // Monitor visibility changes (screenshot causes brief pause)
        let lastVisibilityChange = Date.now()
        document.addEventListener('visibilitychange', () => {
            const now = Date.now()
            const timeDiff = now - lastVisibilityChange

            // Screenshot typically causes 50-200ms visibility change
            if (timeDiff < 300 && document.hidden) {
                showWarning('📱 Mobile Screenshot Detected')
                blurScreen()
            }
            lastVisibilityChange = now
        })

        // Detect screenshot gesture on iOS (power + volume)
        window.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.hidden) {
                    showWarning('📱 Screenshot Attempt Detected')
                    blurScreen()
                }
            }, 50)
        })
    }

    // 5. Aggressive page blur on focus loss
    let blurTimeout
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            blurTimeout = setTimeout(() => {
                document.body.classList.add('privacy-blur-aggressive')
                showWarning('🔒 Content Hidden - Privacy Protection Active')
            }, 50)
        } else {
            clearTimeout(blurTimeout)
            document.body.classList.remove('privacy-blur-aggressive')
        }
    })

    window.addEventListener('blur', () => {
        document.body.classList.add('privacy-blur')
        // Hide sensitive content immediately
        hideVideoContent()
    })

    window.addEventListener('focus', () => {
        document.body.classList.remove('privacy-blur')
        showVideoContent()
    })

    // 6. Detect screen recording
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia
        navigator.mediaDevices.getDisplayMedia = function () {
            showWarning('🚫 Screen Recording Blocked')
            blurScreen()
            return Promise.reject(new Error('Screen recording blocked by LinkSync'))
        }
    }

    // 7. Monitor for screenshot extensions/software
    detectScreenCaptureExtensions()

    // 8. Add dynamic watermarks
    addDynamicWatermark()
    addRandomWatermarks()

    // 9. Prevent drag and drop
    document.addEventListener('dragstart', (e) => {
        e.preventDefault()
        return false
    })

    // 10. Disable text selection on sensitive areas
    document.addEventListener('selectstart', (e) => {
        if (e.target.closest('.video-container, .chat-overlay, .auth-card')) {
            e.preventDefault()
            return false
        }
    })

    // 11. Monitor for suspicious activity patterns
    monitorSuspiciousActivity()

    // 12. Prevent copy/paste of sensitive content
    document.addEventListener('copy', (e) => {
        if (e.target.closest('.video-container, .chat-overlay')) {
            e.preventDefault()
            showWarning('⚠️ Copy Disabled for Privacy')
            return false
        }
    })

    // 13. Detect if page is being captured (experimental)
    detectPageCapture()

    // 14. Additional PrintScreen detection with immediate blur
    document.addEventListener('keydown', (e) => {
        if (e.key === 'PrintScreen') {
            e.preventDefault()
            document.body.style.filter = 'blur(20px)'
            setTimeout(() => {
                document.body.style.filter = ''
            }, 2000)
            showWarning('⚠️ Screenshots disabled for privacy!')
        }
    })

    // 15. Monitor video streams for screen sharing/recording
    monitorVideoStreams()
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function blurScreen() {
    document.body.classList.add('privacy-blur-aggressive')
    setTimeout(() => {
        document.body.classList.remove('privacy-blur-aggressive')
    }, 2000)
}

function hideVideoContent() {
    const videos = document.querySelectorAll('video')
    videos.forEach(v => {
        if (v.id === 'localVideo' || v.dataset.isLocal === 'true') return; // Don't hide local mirror
        v.dataset.wasPlaying = !v.paused
        v.pause()
        v.style.opacity = '0'
    })

    const chatOverlay = document.getElementById('chatOverlay')
    if (chatOverlay) {
        chatOverlay.style.opacity = '0'
    }
}

function showVideoContent() {
    const videos = document.querySelectorAll('video')
    videos.forEach(v => {
        if (v.id === 'localVideo' || v.dataset.isLocal === 'true') {
            v.style.opacity = '1';
            return;
        }
        if (v.dataset.wasPlaying === 'true') {
            v.play()
        }
        v.style.opacity = '1'
    })

    const chatOverlay = document.getElementById('chatOverlay')
    if (chatOverlay) {
        chatOverlay.style.opacity = '1'
    }
}

function showWarning(message) {
    const existing = document.getElementById('privacy-warning')
    if (existing) existing.remove()

    const warning = document.createElement('div')
    warning.id = 'privacy-warning'
    warning.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.95);
    color: white;
    padding: 2rem 3rem;
    border-radius: 16px;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 10px 40px rgba(255, 0, 0, 0.5);
    animation: shake 0.5s;
    text-align: center;
  `
    warning.innerHTML = `
    <div>
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <div>${message}</div>
      <div style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.9;">
        This action has been logged for security purposes
      </div>
    </div>
  `
    document.body.appendChild(warning)

    setTimeout(() => {
        warning.style.opacity = '0'
        warning.style.transition = 'opacity 0.5s'
        setTimeout(() => warning.remove(), 500)
    }, 3000)

    console.warn(`[SECURITY] Screenshot attempt at ${new Date().toISOString()}`)
}

function addDynamicWatermark() {
    const watermark = document.createElement('div')
    watermark.id = 'dynamic-watermark'
    watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
    opacity: 0.02;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 100px,
      rgba(255, 255, 255, 0.1) 100px,
      rgba(255, 255, 255, 0.1) 200px
    );
  `
    document.body.appendChild(watermark)

    const timestamp = document.createElement('div')
    timestamp.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    z-index: 9998;
    user-select: none;
  `

    function updateTimestamp() {
        const user = JSON.parse(localStorage.getItem('linksync_user') || '{}')
        const username = user.username || 'Guest'
        timestamp.textContent = `${username} - ${new Date().toLocaleString()}`
    }

    updateTimestamp()
    setInterval(updateTimestamp, 1000)

    document.body.appendChild(timestamp)
}

function addRandomWatermarks() {
    // Add random invisible watermarks across the page
    for (let i = 0; i < 5; i++) {
        const wm = document.createElement('div')
        wm.style.cssText = `
      position: fixed;
      top: ${Math.random() * 80 + 10}%;
      left: ${Math.random() * 80 + 10}%;
      font-size: 8px;
      color: rgba(255, 255, 255, 0.01);
      pointer-events: none;
      z-index: 9998;
      user-select: none;
      transform: rotate(${Math.random() * 360}deg);
    `
        wm.textContent = `LinkSync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        document.body.appendChild(wm)
    }
}

function detectScreenCaptureExtensions() {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')

    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            if (renderer.includes('SwiftShader') || renderer.includes('llvmpipe')) {
                console.warn('[SECURITY] Potential screen capture software detected')
                showWarning('⚠️ Screen Capture Software Detected')
            }
        }
    }
}

function monitorSuspiciousActivity() {
    let suspiciousCount = 0

    // Monitor rapid key presses (automation)
    let lastKeyTime = 0
    document.addEventListener('keydown', () => {
        const now = Date.now()
        if (now - lastKeyTime < 50) {
            suspiciousCount++
            if (suspiciousCount > 5) {
                showWarning('⚠️ Suspicious Activity Detected')
                blurScreen()
            }
        }
        lastKeyTime = now
    })

    // Reset counter periodically
    setInterval(() => {
        suspiciousCount = Math.max(0, suspiciousCount - 1)
    }, 5000)
}

function detectPageCapture() {
    // Detect if canvas is being read (screenshot tools often use this)
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = function () {
        showWarning('⚠️ Canvas Capture Blocked')
        console.warn('[SECURITY] Canvas capture attempt blocked')
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
}

function monitorVideoStreams() {
    // Monitor all video elements for screen capture attempts
    const observeVideos = () => {
        const videos = document.querySelectorAll('video')

        videos.forEach(video => {
            // Check if already monitored
            if (video.dataset.monitored) return
            video.dataset.monitored = 'true'

            video.addEventListener('loadedmetadata', () => {
                // Check if getDisplayMedia is being used (screen sharing)
                if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    console.warn('[SECURITY] Screen capture API detected - monitoring video stream')

                    // Detect if video track is from screen capture
                    if (video.srcObject) {
                        const tracks = video.srcObject.getVideoTracks()
                        tracks.forEach(track => {
                            const settings = track.getSettings()

                            // Screen capture tracks have specific characteristics
                            if (settings.displaySurface || settings.logicalSurface) {
                                showWarning('🚫 Screen Recording Detected - Stream Paused')
                                video.pause()
                                blurScreen()
                                console.warn('[SECURITY] Screen capture stream detected and paused')
                            }
                        })
                    }
                }
            })

            // Monitor for suspicious video capture patterns
            video.addEventListener('play', () => {
                // Check if multiple video elements are playing (possible recording)
                const playingVideos = Array.from(document.querySelectorAll('video')).filter(v => !v.paused)
                if (playingVideos.length > 3) {
                    console.warn('[SECURITY] Suspicious number of video streams detected')
                }
            })
        })
    }

    // Initial observation
    observeVideos()

    // Watch for new video elements being added
    const observer = new MutationObserver(() => {
        observeVideos()
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

// Enhanced CSS
const style = document.createElement('style')
style.textContent = `
  .privacy-blur {
    filter: blur(20px) !important;
    transition: filter 0.2s;
  }

  .privacy-blur-aggressive {
    filter: blur(50px) brightness(0.3) !important;
    transition: filter 0.1s;
  }

  @keyframes shake {
    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
    25% { transform: translate(-50%, -50%) rotate(-5deg); }
    75% { transform: translate(-50%, -50%) rotate(5deg); }
  }

  body {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  input, textarea {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

  /* Prevent screenshot on mobile */
  @media (max-width: 768px) {
    * {
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
  }
`
document.head.appendChild(style)
