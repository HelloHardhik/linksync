import { navigateTo } from '../main.js'

const INTERESTS = [
    'Gaming Sessions', 'Anime Drops', 'Foodie', 'Flirty Chats',
    'Music Stans', 'Love Stories', 'Platonic Bonds', 'Cozy Gaming',
    'Anime Waifus', 'Street Foodies', 'Subtle Flirts', 'Late Night Ramen',
    'Controller Battles', 'Manga Panels', 'Snack Tier Lists', 'Playlist Swaps'
]

export function initHome() {
    const grid = document.getElementById('interestGrid')
    const connectRandom = document.getElementById('connectRandom')
    const connectGirl = document.getElementById('connectGirl')
    const connectBoy = document.getElementById('connectBoy')

    // Populate Grid
    INTERESTS.forEach(interest => {
        const el = document.createElement('div')
        el.className = 'interest-item'
        el.textContent = interest
        el.onclick = () => {
            el.classList.toggle('selected')
        }
        grid.appendChild(el)
    })

    // Toggle Filters
    const toggleAgeBtn = document.getElementById('toggleAgeBtn')
    const toggleCountryBtn = document.getElementById('toggleCountryBtn')
    const ageWrapper = document.getElementById('ageFilterWrapper')
    const countryWrapper = document.getElementById('countryFilterWrapper')

    const updateToggleState = (btn, wrapper, active, text, icon) => {
        wrapper.style.display = active ? 'block' : 'none'
        btn.style.borderColor = active ? 'var(--neon-cyan)' : 'var(--glass-border)'
        btn.style.color = active ? 'var(--neon-cyan)' : ''
        btn.textContent = active ? `✕ Remove ${text}` : `${icon} Filter by ${text}`
    }

    let ageActive = false
    let countryActive = false

    if (toggleAgeBtn && ageWrapper) {
        toggleAgeBtn.onclick = () => {
            ageActive = !ageActive
            updateToggleState(toggleAgeBtn, ageWrapper, ageActive, 'Age', '🎂')
        }
    }

    if (toggleCountryBtn && countryWrapper) {
        toggleCountryBtn.onclick = () => {
            countryActive = !countryActive
            updateToggleState(toggleCountryBtn, countryWrapper, countryActive, 'Country', '🌐')
        }
    }

    // Connect Handlers
    const startVideo = (gender = 'any') => {
        const selected = Array.from(document.querySelectorAll('.interest-item.selected'))
            .map(el => el.textContent)

        const isAgeActive = ageWrapper && ageWrapper.style.display !== 'none'
        const isCountryActive = countryWrapper && countryWrapper.style.display !== 'none'

        const minAge = isAgeActive ? (document.getElementById('filterMinAge')?.value || '18') : '18'
        const maxAge = isAgeActive ? (document.getElementById('filterMaxAge')?.value || '100') : '100'
        const country = isCountryActive ? (document.getElementById('filterCountry')?.value || 'ANY') : 'ANY'

        // Store preferences for the video session
        sessionStorage.setItem('linksync_pref_gender', gender)
        sessionStorage.setItem('linksync_pref_interests', JSON.stringify(selected))
        sessionStorage.setItem('linksync_pref_age_active', isAgeActive ? 'true' : 'false')
        sessionStorage.setItem('linksync_pref_country_active', isCountryActive ? 'true' : 'false')
        sessionStorage.setItem('linksync_pref_min_age', minAge)
        sessionStorage.setItem('linksync_pref_max_age', maxAge)
        sessionStorage.setItem('linksync_pref_country', country)

        navigateTo('video')
    }

    connectRandom.addEventListener('click', () => startVideo('any'))
    connectGirl.addEventListener('click', () => startVideo('female'))
    connectBoy.addEventListener('click', () => startVideo('male'))
}
