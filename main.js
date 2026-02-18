import './style.css'
import { initAuth } from './src/auth.js'
import { initHome } from './src/ui.js'
import { initVideo } from './src/video.js'
import { store } from './src/store.js'
import { initProfile } from './src/profile.js'
import { initProtection } from './src/protection.js'
import { initParticleBackground } from './src/particles.js'
import { initAllVideoDRM, preventVideoDownload } from './src/drm.js'
import { initVantaBackground, destroyVantaBackground } from './src/vanta.js'
import { initProfileSetup, needsProfileSetup } from './src/profileSetup.js'

// Router / View Management
const app = document.querySelector('#app')
const navAuthBtn = document.querySelector('#authBtn')
const navProfileBtn = document.getElementById('navProfile') // We will add this to HTML

const routes = {
    auth: { templateId: 'view-auth', init: initAuth },
    home: { templateId: 'view-home', init: initHome },
    video: { templateId: 'view-video', init: initVideo },
    profile: { templateId: 'view-profile', init: initProfile },
    'profile-setup': { templateId: 'view-profile-setup', init: initProfileSetup }
}

export function navigateTo(view) {
    const templates = {
        auth: 'view-auth',
        home: 'view-home',
        video: 'view-video',
        profile: 'view-profile',
        'profile-setup': 'view-profile-setup'
    }

    const user = store.getUser()
    const isGuest = store.isGuest()

    // Protect routes
    if (view !== 'auth' && !user && !isGuest) {
        console.warn('Unauthorized access. Redirecting to auth.');
        view = 'auth'
    }

    const templateId = templates[view]
    if (!templateId) {
        console.error('Unknown view:', view)
        return
    }

    const template = document.getElementById(templateId)
    if (!template) {
        console.error('Template not found:', templateId)
        return
    }

    app.innerHTML = ''
    const content = template.content.cloneNode(true)
    app.appendChild(content)

    // Update navbar
    updateNavbar(view)

    // Handle Vanta Background
    initVantaBackground()

    // Initialize view-specific logic
    if (view === 'auth') {
        initAuth()
    } else if (view === 'home') {
        initHome()
    } else if (view === 'video') {
        initVideo()
    } else if (view === 'profile') {
        initProfile()
    } else if (view === 'profile-setup') {
        initProfileSetup()
    }
}

function updateNavbar(currentRoute) {
    const user = store.getUser()

    if (user) {
        navAuthBtn.textContent = 'Logout'
        navAuthBtn.onclick = () => {
            store.logout()
            navigateTo('auth')
        }
        // Add Profile Link
        if (navProfileBtn) {
            navProfileBtn.style.display = 'inline-block'
            navProfileBtn.onclick = (e) => {
                e.preventDefault()
                navigateTo('profile')
            }
        }
    } else {
        navAuthBtn.textContent = 'Login'
        navAuthBtn.onclick = () => navigateTo('auth')
        if (navProfileBtn) navProfileBtn.style.display = 'none'
    }

    // Hide Navbar in Video Mode for immersion? Or keep it?
    // User requested "fixed top glass nav", but full screen video usually implies hiding it or overlaying it.
    // We'll keep it simple for now: valid routes.
    const nav = document.querySelector('.navbar')
    if (currentRoute === 'video') {
        nav.style.display = 'none' // Full immersion for video
    } else {
        nav.style.display = 'flex'
    }
}

// Initial Load
function initApp() {
    // Initialize protection first
    initProtection()

    // Initialize Vanta waves background (bottom layer)
    initVantaBackground()

    // Initialize particle background (top layer)
    initParticleBackground()

    // Initialize DRM protection for videos
    initAllVideoDRM()
    preventVideoDownload()

    const user = store.getUser()
    const isGuest = store.isGuest()

    // Check authentication and profile setup
    if (user || isGuest) {
        if (needsProfileSetup()) {
            navigateTo('profile-setup')
        } else {
            navigateTo('home')
        }
    } else {
        navigateTo('auth')
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp)
} else {
    initApp()
}

// Expose navigation for dev/testing
window.navigateTo = navigateTo
