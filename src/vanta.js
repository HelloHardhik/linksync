// Vanta.js Waves Background Initialization

let vantaEffect = null
let vantaAttempts = 0
const MAX_VANTA_ATTEMPTS = 50 // 5 seconds

export function initVantaBackground() {
    if (typeof window.VANTA === 'undefined' || typeof window.THREE === 'undefined') {
        vantaAttempts++
        if (vantaAttempts < MAX_VANTA_ATTEMPTS) {
            setTimeout(initVantaBackground, 100)
        } else {
            console.warn('[VANTA] Libraries failed to load after 5s, skipping.')
        }
        return
    }
    setVanta()
}

function setVanta() {
    const vantaElement = document.getElementById('vantaBackground')
    if (!vantaElement) return

    try {
        if (vantaEffect) vantaEffect.destroy()

        vantaEffect = window.VANTA.WAVES({
            el: vantaElement,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x2572ac,
            shininess: 30.00,
            waveHeight: 15.00,
            waveSpeed: 1.00,
            zoom: 1.00,
            THREE: window.THREE
        })

        window.vantaEffect = vantaEffect
    } catch (error) {
        console.error('[VANTA] Error:', error)
    }
}

export function reinitVanta() {
    if (window.VANTA && window.THREE) setVanta()
}

export function destroyVantaBackground() {
    if (vantaEffect) {
        vantaEffect.destroy()
        vantaEffect = null
    }
}
