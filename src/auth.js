import { navigateTo } from '../main.js'
import { store } from './store.js'

export function initAuth() {
    const form = document.getElementById('authForm')
    const guestBtn = document.getElementById('guestBtn')
    const tabLogin = document.getElementById('tabLogin')
    const tabSignup = document.getElementById('tabSignup')
    const signupFields = document.getElementById('signupFields')
    const submitText = document.getElementById('submitText')

    let isLogin = true

    // Tab Switching
    tabLogin.addEventListener('click', () => {
        isLogin = true
        tabLogin.classList.add('active')
        tabSignup.classList.remove('active')
        signupFields.classList.add('hidden')
        submitText.textContent = 'Login'
    })

    tabSignup.addEventListener('click', () => {
        isLogin = false
        tabSignup.classList.add('active')
        tabLogin.classList.remove('active')
        signupFields.classList.remove('hidden')
        submitText.textContent = 'Sign Up'
    })

    // Guest Access
    guestBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/guest', { method: 'POST' })
            const guest = await res.json()
            store.setGuest(guest.id)
            localStorage.removeItem('linksync_profile_complete')
            navigateTo('profile-setup')
        } catch (e) {
            console.error('Guest login failed:', e)
            store.setGuest()
            localStorage.removeItem('linksync_profile_complete')
            navigateTo('profile-setup')
        }
    })

    // Form Submit (Real Backend Logic)
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = form.querySelector('input[type="email"]').value
        const password = form.querySelector('input[type="password"]').value

        const endpoint = isLogin ? '/api/auth/register' : '/api/auth/register' // In this demo both go to register for simplicity

        try {
            const res = await fetch('http://localhost:3000' + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username: email.split('@')[0] })
            })
            const user = await res.json()
            store.login(user)
            localStorage.removeItem('linksync_profile_complete')
            navigateTo('profile-setup')
        } catch (e) {
            console.error('Auth failed:', e)
            // Fallback for local testing
            const user = { id: 'local_' + Date.now(), email, username: email.split('@')[0] }
            store.login(user)
            localStorage.removeItem('linksync_profile_complete')
            navigateTo('profile-setup')
        }
    })
}
