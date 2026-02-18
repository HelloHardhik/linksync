// Profile Setup Logic

import { store } from './store.js'
import { navigateTo } from '../main.js'

export function initProfileSetup() {
    const form = document.getElementById('profileSetupForm')
    if (!form) return

    form.addEventListener('submit', (e) => {
        e.preventDefault()

        const username = document.getElementById('setupUsername').value.trim()
        const gender = document.getElementById('setupGender').value
        const age = parseInt(document.getElementById('setupAge').value)
        const country = document.getElementById('setupCountry').value

        // Validate inputs
        if (!username || username.length < 3) {
            alert('Username must be at least 3 characters')
            return
        }

        if (!gender) {
            alert('Please select your gender')
            return
        }

        if (!age || age < 18 || age > 100) {
            alert('Please enter a valid age (18-100)')
            return
        }

        if (!country) {
            alert('Please select your country')
            return
        }

        // Get existing user data
        let user = store.getUser()
        const isGuest = store.isGuest()

        // Update user profile
        if (isGuest) {
            user = {
                username: username,
                email: 'guest@linksync.app',
                gender: gender,
                age: age,
                country: country,
                isGuest: true
            }
            localStorage.setItem('linksync_user', JSON.stringify(user))
        } else if (user) {
            user.username = username
            user.gender = gender
            user.age = age
            user.country = country
            localStorage.setItem('linksync_user', JSON.stringify(user))
        }

        // Mark profile as complete
        localStorage.setItem('linksync_profile_complete', 'true')

        console.log('[PROFILE] Profile setup completed:', { username, gender, age, country })

        // Navigate to home
        navigateTo('home')
    })
}

// Check if profile setup is needed
export function needsProfileSetup() {
    const user = store.getUser()
    const isGuest = store.isGuest()
    const profileComplete = localStorage.getItem('linksync_profile_complete')

    // If user exists (logged in or guest) but profile not complete
    if ((user || isGuest) && !profileComplete) {
        return true
    }

    // If user exists but missing required fields
    if (user && (!user.username || !user.gender || !user.age || !user.country)) {
        return true
    }

    return false
}
