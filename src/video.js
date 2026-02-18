import { navigateTo } from '../main.js'
import { store } from './store.js'

export function initVideo() {
    const localVideo = document.getElementById('localVideo')
    const remoteVideo = document.getElementById('remoteVideo')
    const statusOverlay = document.getElementById('statusOverlay')
    const statusText = statusOverlay.querySelector('.status-text')
    const nextBtn = document.getElementById('vidNextBtn')
    const stopBtn = document.getElementById('vidStopBtn')

    // PeerJS Variables
    let peer = null
    let socket = null
    let currentCall = null
    let currentConn = null
    let localStream = null
    let isConnected = false
    let searchTimeout = null
    let currentRemoteUser = null

    // 1) Initialize PeerJS & WebSocket
    function initPeer() {
        console.log('[VIDEO] Initializing PeerJS & Matchmaker...')

        // Connect to Cloudflare Worker (Replace with your actual worker URL after deployment)
        // For now, we'll try to connect, but handle failure gracefully
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use a placeholder or environment variable. 
        // If you have a real separate backend, put it here.
        const backendUrl = `${protocol}//linksync-backend.hellohardhik.workers.dev`;

        try {
            socket = new WebSocket(backendUrl);

            socket.onopen = () => {
                console.log('[WS] Connected to Matchmaker');
                statusText.textContent = "Connected to server!";
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'match-found') {
                    console.log('[WS] Match found! Role:', data.role);
                    if (data.role === 'caller') {
                        initiateCall(data.partnerPeerId);
                    } else {
                        statusText.textContent = "Connecting to peer...";
                    }
                }
            };

            socket.onerror = (err) => {
                console.warn('[WS] Connection failed (Backend likely not deployed). Switching to Demo/Bot Mode.', err);
                socket = null; // Ensure we know it failed
            };

        } catch (e) {
            console.error('[WS] Error initializing:', e);
            socket = null;
        }

        peer = new Peer(undefined, {
            debug: 1,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        })

        peer.on('open', (id) => {
            console.log('[PEER] My ID:', id)
            startCamera()
        })

        peer.on('call', (call) => {
            console.log('[PEER] Incoming call from:', call.peer)
            if (localStream) {
                call.answer(localStream)
                handleCall(call)
            }
        })

        peer.on('connection', (conn) => {
            console.log('[PEER] Incoming chat connection')
            setupChatConnection(conn)
        })

        // Socket Matchmaking
        socket.on('match-found', (data) => {
            console.log('[SOCKET] Match found! Role:', data.role)
            if (data.role === 'caller') {
                initiateCall(data.partnerPeerId)
            } else {
                // Wait for the incoming call
                statusText.textContent = "Connecting to peer..."
            }
        })

        peer.on('error', (err) => {
            console.error('[PEER] PeerJS Error:', err.type, err)
            if (err.type === 'peer-unavailable') startSearching()
        })
    }

    // 2) Camera Logic
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            localStream = stream
            localVideo.srcObject = stream
            await localVideo.play()
            startSearching()
        } catch (err) {
            console.error('Camera error:', err)
            statusText.textContent = "Camera access required!"
        }
    }

    // 3) Search & Matchmaking
    function startSearching() {
        if (socket && socket.readyState === 1) socket.send(JSON.stringify({ type: 'stop-search' }))
        cleanupCurrentConnection()
        isConnected = false
        remoteVideo.srcObject = null
        remoteVideo.src = ""
        remoteVideo.style.opacity = '0'
        statusOverlay.style.display = 'block'
        hideRemoteProfilePic()

        const storedInterests = JSON.parse(sessionStorage.getItem('linksync_pref_interests') || '[]')
        const filterText = getFilterDescription()

        statusText.textContent = storedInterests.length > 0
            ? `Finding someone into ${storedInterests[0]}${filterText}...`
            : `Searching for a match${filterText}...`

        // Layout reset
        const selfWrapper = document.getElementById('selfViewWrapper')
        if (selfWrapper) {
            selfWrapper.classList.add('searching-mode')
            selfWrapper.style.cssText = `position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; border-radius: 0; border: none; z-index: 5;`
        }

        if (peer && peer.id) {
            // If connected to Cloudflare backend
            if (socket && socket.readyState === 1) {
                socket.send(JSON.stringify({
                    type: 'start-search',
                    peerId: peer.id,
                    interests: storedInterests,
                    gender: sessionStorage.getItem('linksync_pref_gender'),
                    age: sessionStorage.getItem('linksync_pref_min_age'),
                    country: sessionStorage.getItem('linksync_pref_country')
                }));
            } else {
                // FALLBACK: Simulate connect to Bot if no backend
                console.warn('[MATCHMAKER] Backend unreachable. Using offline/bot mode.');
                statusText.textContent = "Connecting to demo user...";
                connectToBot();
            }
        }
    }

    function getFilterDescription() {
        const ageActive = sessionStorage.getItem('linksync_pref_age_active') === 'true'
        const countryActive = sessionStorage.getItem('linksync_pref_country_active') === 'true'
        const minAge = sessionStorage.getItem('linksync_pref_min_age') || '18'
        const maxAge = sessionStorage.getItem('linksync_pref_max_age') || '100'
        const prefCountry = sessionStorage.getItem('linksync_pref_country')

        let filterParts = []
        if (ageActive) filterParts.push(`Age ${minAge}-${maxAge}`)
        if (countryActive && prefCountry !== 'ANY') filterParts.push(`in ${prefCountry}`)
        return filterParts.length > 0 ? ` (${filterParts.join(' ')})` : ""
    }

    // 4) Peer Communication
    function handleCall(call) {
        currentCall = call
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream
            remoteVideo.style.opacity = '1'
            remoteVideo.play().catch(() => { })
            onMatchSuccess({ name: 'User Matched', id: call.peer })
        })
        call.on('close', startSearching)
        call.on('error', startSearching)
    }

    function setupChatConnection(conn) {
        currentConn = conn
        conn.on('data', (data) => {
            if (data.type === 'chat') addChatMessage(data.text, 'remote')
        })
        conn.on('close', startSearching)
    }

    function cleanupCurrentConnection() {
        if (currentCall) currentCall.close()
        if (currentConn) currentConn.close()
        currentCall = null
        currentConn = null
    }

    // 5) Bot Fallback (Matching Logic)
    function connectToBot() {
        const randomNames = ['Alex', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Jamie']
        const candidateName = randomNames[Math.floor(Math.random() * randomNames.length)]

        currentRemoteUser = {
            id: 'bot_' + Date.now(),
            name: candidateName + ' (System AI)',
            profilePic: `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`,
            isBot: true
        }

        onMatchSuccess(currentRemoteUser)

        const MOCK_VIDEOS = [
            "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lights-listening-to-music-4489-large.mp4",
            "https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-in-a-coffee-shop-2432-large.mp4",
            "https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-at-the-camera-4322-large.mp4"
        ]

        setTimeout(() => {
            if (!isConnected) return
            hideRemoteProfilePic()
            remoteVideo.srcObject = null
            remoteVideo.src = MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)]
            remoteVideo.style.opacity = '1'
            remoteVideo.play().catch(() => { })
        }, 2000)
    }

    function onMatchSuccess(user) {
        isConnected = true
        currentRemoteUser = user
        statusOverlay.style.display = 'none'

        if (addFriendBtn) { addFriendBtn.style.color = ''; addFriendBtn.textContent = '👤+' }
        if (likeBtn) likeBtn.classList.remove('liked-glow')

        const selfWrapper = document.getElementById('selfViewWrapper')
        if (selfWrapper) {
            selfWrapper.classList.remove('searching-mode')
            selfWrapper.style.cssText = `position: absolute; top: 20px; right: 20px; width: 210px; height: 130px; border-radius: 12px; overflow: hidden; border: 4px solid #000000; box-shadow: 0 10px 30px rgba(0,0,0,0.6); cursor: grab; z-index: 20; background: #111;`
        }

        if (user.isBot) showRemoteProfilePic()
    }

    function showRemoteProfilePic() {
        let profileOverlay = document.getElementById('remoteProfileOverlay')
        if (!profileOverlay) {
            profileOverlay = document.createElement('div')
            profileOverlay.id = 'remoteProfileOverlay'
            document.querySelector('.call-wrapper').appendChild(profileOverlay)
        }
        profileOverlay.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 15; backdrop-filter: blur(10px); background: rgba(0,0,0,0.4);`
        profileOverlay.innerHTML = `
            <img src="${currentRemoteUser.profilePic}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--neon-cyan); margin-bottom: 1rem; box-shadow: 0 0 30px var(--neon-cyan);">
            <h2 style="color: #fff; font-size: 2.2rem; text-shadow: 0 0 10px rgba(0,0,0,0.5);">${currentRemoteUser.name}</h2>
            <p style="color: var(--text-dim);">Establishing secure connection...</p>
        `
        profileOverlay.style.display = 'flex'
    }

    function hideRemoteProfilePic() {
        const profileOverlay = document.getElementById('remoteProfileOverlay')
        if (profileOverlay) profileOverlay.style.display = 'none'
    }

    // UI Controls
    nextBtn.onclick = () => startSearching()
    stopBtn.onclick = () => {
        if (localStream) localStream.getTracks().forEach(track => track.stop())
        cleanupCurrentConnection()
        if (peer) peer.destroy()
        navigateTo('home')
    }

    const addFriendBtn = document.getElementById('addFriendBtn')
    const likeBtn = document.getElementById('likeBtn')
    const reportBtn = document.getElementById('reportBtn')

    likeBtn.onclick = () => {
        if (!currentRemoteUser) return
        likeBtn.classList.toggle('liked-glow')
        if (likeBtn.classList.contains('liked-glow')) {
            const social = store.getSocialData()
            if (!social.liked.some(u => u.name === currentRemoteUser.name)) {
                social.liked.push(currentRemoteUser)
                store.updateSocialData(social)
            }
        }
    }

    addFriendBtn.onclick = () => {
        if (!currentRemoteUser) return
        addFriendBtn.style.color = 'var(--neon-cyan)'
        addFriendBtn.textContent = '✔️'
        const social = store.getSocialData()
        if (!social.friendRequests.some(u => u.name === currentRemoteUser.name)) {
            social.friendRequests.push(currentRemoteUser)
            store.updateSocialData(social)
        }
    }

    // Chat
    const chatInput = document.getElementById('chatInput')
    const sendBtn = document.getElementById('sendBtn')
    const chatMessages = document.getElementById('chatMessages')
    const toggleChatBtn = document.getElementById('toggleChatBtn')
    const closeChatBtn = document.getElementById('closeChatBtn')
    const chatOverlay = document.getElementById('chatOverlay')

    toggleChatBtn.onclick = () => chatOverlay.classList.toggle('minimized')
    closeChatBtn.onclick = () => chatOverlay.classList.add('minimized')

    function sendMessage() {
        const text = chatInput.value.trim()
        if (!text) return
        addChatMessage(text, 'local')
        chatInput.value = ''

        if (currentConn && currentConn.open) {
            currentConn.send({ type: 'chat', text: text })
        } else if (currentRemoteUser?.isBot) {
            simulateBotReply()
        }
    }

    function simulateBotReply() {
        const id = 'typ_' + Date.now()
        const msg = document.createElement('div')
        msg.className = 'chat-msg remote typing-indicator'
        msg.id = id
        msg.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'
        chatMessages.appendChild(msg)
        chatMessages.scrollTop = chatMessages.scrollHeight

        setTimeout(() => {
            const el = document.getElementById(id)
            if (el) el.remove()
            if (!isConnected) return
            const replies = ["Hey!", "How are you?", "This site looks amazing!", "I'm a bot, but I can chat!"]
            addChatMessage(replies[Math.floor(Math.random() * replies.length)], 'remote')
        }, 2000)
    }

    function addChatMessage(text, type) {
        const msg = document.createElement('div')
        msg.className = `chat-msg ${type}`
        msg.textContent = text
        chatMessages.appendChild(msg)
        chatMessages.scrollTop = chatMessages.scrollHeight
    }

    sendBtn.onclick = sendMessage
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage() }

    // Start
    initPeer()

    // Draggable
    const selfWrapper = document.getElementById('selfViewWrapper')
    const callWrapper = document.querySelector('.call-wrapper')
    let isDragging = false, offsetX = 0, offsetY = 0
    selfWrapper.onmousedown = (e) => {
        if (selfWrapper.classList.contains('searching-mode')) return
        isDragging = true
        const rect = selfWrapper.getBoundingClientRect()
        offsetX = e.clientX - rect.left
        offsetY = e.clientY - rect.top
    }
    document.onmousemove = (e) => {
        if (!isDragging) return
        const parentRect = callWrapper.getBoundingClientRect()
        let x = e.clientX - parentRect.left - offsetX
        let y = e.clientY - parentRect.top - offsetY
        const maxX = parentRect.width - selfWrapper.offsetWidth
        const maxY = parentRect.height - selfWrapper.offsetHeight
        x = Math.max(0, Math.min(x, maxX))
        y = Math.max(0, Math.min(y, maxY))
        selfWrapper.style.left = x + 'px'; selfWrapper.style.top = y + 'px'; selfWrapper.style.right = 'auto'; selfWrapper.style.bottom = 'auto'
    }
    document.onmouseup = () => isDragging = false
}
