import { store } from './store.js'

export function initProfile() {
    const user = store.getUser()
    if (!user) return

    const profileName = document.getElementById('profileName')
    const profileEmail = document.getElementById('profileEmail')
    const friendRequestsList = document.getElementById('friendRequestsList')
    const friendsList = document.getElementById('friendsList')
    const likedList = document.getElementById('likedList')
    const blockedList = document.getElementById('blockedList')

    profileName.textContent = user.username || 'Guest'
    profileEmail.textContent = user.email || 'guest@linksync.app'

    // Get Social Data
    let social = store.getSocialData()

    // Add mock data if empty
    if (!social.friendRequests || social.friendRequests.length === 0) {
        social.friendRequests = [
            { id: 'req1', name: 'Alex Johnson', profilePic: 'https://i.pravatar.cc/100?img=12' },
            { id: 'req2', name: 'Sam Rivera', profilePic: 'https://i.pravatar.cc/100?img=25' }
        ]
    }

    if (!social.friends || social.friends.length === 0) {
        social.friends = [
            { id: 'f1', name: 'Jordan Lee', profilePic: 'https://i.pravatar.cc/100?img=33' }
        ]
    }

    if (!social.liked || social.liked.length === 0) {
        social.liked = [
            { id: 'l1', name: 'Casey Morgan', profilePic: 'https://i.pravatar.cc/100?img=45' }
        ]
    }

    if (!social.blocked || social.blocked.length === 0) {
        social.blocked = []
    }

    store.updateSocialData(social)

    // Render Lists
    renderFriendRequests(friendRequestsList, social.friendRequests)
    renderFriends(friendsList, social.friends)
    renderLiked(likedList, social.liked)
    renderBlocked(blockedList, social.blocked)
}

function renderFriendRequests(container, requests) {
    container.innerHTML = ''
    if (!requests || requests.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); font-style: italic;">No pending requests</div>`
        return
    }

    requests.forEach(req => {
        const el = document.createElement('div')
        el.className = 'glass-panel'
        el.style.cssText = 'padding: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;'
        el.innerHTML = `
      <img src="${req.profilePic}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--neon-purple);">
      <span style="flex: 1; font-weight: 500;">${req.name}</span>
      <button class="btn btn-primary btn-sm" onclick="window.acceptFriendRequest('${req.id}')">Accept</button>
      <button class="btn btn-outline btn-sm" onclick="window.rejectFriendRequest('${req.id}')">Reject</button>
    `
        container.appendChild(el)
    })
}

function renderFriends(container, friends) {
    container.innerHTML = ''
    if (!friends || friends.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); font-style: italic;">No friends yet</div>`
        return
    }

    friends.forEach(friend => {
        const el = document.createElement('div')
        el.className = 'glass-panel'
        el.style.cssText = 'padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;'
        el.innerHTML = `
      <img src="${friend.profilePic}" style="width: 40px; height: 40px; border-radius: 50%;">
      <span style="flex: 1;">${friend.name}</span>
      <button class="btn btn-ghost btn-sm">💬</button>
    `
        container.appendChild(el)
    })
}

function renderLiked(container, liked) {
    container.innerHTML = ''
    if (!liked || liked.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); font-style: italic;">No liked users</div>`
        return
    }

    liked.forEach(user => {
        const el = document.createElement('div')
        el.className = 'glass-panel'
        el.style.cssText = 'padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;'
        el.innerHTML = `
      <img src="${user.profilePic}" style="width: 40px; height: 40px; border-radius: 50%;">
      <span style="flex: 1;">${user.name}</span>
      <span style="color: var(--neon-pink);">❤️</span>
    `
        container.appendChild(el)
    })
}

function renderBlocked(container, blocked) {
    container.innerHTML = ''
    if (!blocked || blocked.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); font-style: italic;">No blocked users</div>`
        return
    }

    blocked.forEach(user => {
        const el = document.createElement('div')
        el.className = 'glass-panel'
        el.style.cssText = 'padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;'
        el.innerHTML = `
      <img src="${user.profilePic}" style="width: 40px; height: 40px; border-radius: 50%; filter: grayscale(100%);">
      <span style="flex: 1; color: var(--text-dim);">${user.name}</span>
      <button class="btn btn-outline btn-sm" onclick="window.unblockUser('${user.id}')">Unblock</button>
    `
        container.appendChild(el)
    })
}

// Global functions for friend request handling
window.acceptFriendRequest = (reqId) => {
    const social = store.getSocialData()
    const reqIndex = social.friendRequests.findIndex(r => r.id === reqId)

    if (reqIndex !== -1) {
        const [request] = social.friendRequests.splice(reqIndex, 1)
        social.friends.push(request)
        store.updateSocialData(social)
        initProfile() // Refresh
    }
}

window.rejectFriendRequest = (reqId) => {
    const social = store.getSocialData()
    social.friendRequests = social.friendRequests.filter(r => r.id !== reqId)
    store.updateSocialData(social)
    initProfile() // Refresh
}

window.unblockUser = (userId) => {
    const social = store.getSocialData()
    social.blocked = social.blocked.filter(u => u.id !== userId)
    store.updateSocialData(social)
    initProfile() // Refresh
}
