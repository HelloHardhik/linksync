export const store = {
    key: 'linksync_user',
    guestKey: 'linksync_is_guest',

    login(user) {
        localStorage.setItem(this.key, JSON.stringify(user))
        localStorage.removeItem(this.guestKey)
    },

    setGuest() {
        localStorage.setItem(this.guestKey, 'true')
    },

    logout() {
        localStorage.removeItem(this.key)
        localStorage.removeItem(this.guestKey)
    },

    getUser() {
        const data = localStorage.getItem(this.key)
        return data ? JSON.parse(data) : null
    },

    isGuest() {
        return localStorage.getItem(this.guestKey) === 'true'
    },

    // Mock Social data persistence
    getSocialData() {
        const data = localStorage.getItem('linksync_social')
        const social = data ? JSON.parse(data) : {}
        return {
            friends: social.friends || [],
            blocked: social.blocked || [],
            liked: social.liked || [],
            friendRequests: social.friendRequests || []
        }
    },

    updateSocialData(data) {
        localStorage.setItem('linksync_social', JSON.stringify(data))
    }
}
