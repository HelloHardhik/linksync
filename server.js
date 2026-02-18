import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Mock Database (Persistence for this session)
const users = [];
const guests = [];
const waitingUsers = []; // { socketId, peerId, interests, gender, ... }

// API: Auth
app.post('/api/auth/register', (req, res) => {
    const { username, password, email } = req.body;
    const user = { id: uuidv4(), username, email, social: { friends: [], blocked: [], liked: [], friendRequests: [] } };
    users.push(user);
    res.json(user);
});

app.post('/api/auth/guest', (req, res) => {
    const guest = { id: 'guest_' + uuidv4().substring(0, 8), isGuest: true };
    guests.push(guest);
    res.json(guest);
});

// Real-time Matchmaking with Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('start-search', (data) => {
        const { peerId, interests, gender, age, country } = data;

        console.log(`User ${socket.id} (Peer: ${peerId}) started searching...`);

        // Look for existing match
        const matchIndex = waitingUsers.findIndex(u => {
            // Basic matching logic: 
            // 1) Different socket
            if (u.socketId === socket.id) return false;

            // 2) Could add more logic here (interests, age, gender)
            // For now, let's just find the first available peer
            return true;
        });

        if (matchIndex !== -1) {
            const partner = waitingUsers.splice(matchIndex, 1)[0];

            console.log(`Match Found: ${socket.id} <-> ${partner.socketId}`);

            // Notify both users
            io.to(socket.id).emit('match-found', {
                partnerPeerId: partner.peerId,
                role: 'caller' // This user will call
            });

            io.to(partner.socketId).emit('match-found', {
                partnerPeerId: peerId,
                role: 'receiver' // This user will wait for call
            });
        } else {
            // Add to waiting list
            waitingUsers.push({
                socketId: socket.id,
                peerId,
                interests,
                gender,
                age,
                country
            });
        }
    });

    socket.on('stop-search', () => {
        removeFromWaiting(socket.id);
    });

    socket.on('disconnect', () => {
        removeFromWaiting(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

function removeFromWaiting(socketId) {
    const index = waitingUsers.findIndex(u => u.socketId === socketId);
    if (index !== -1) waitingUsers.splice(index, 1);
}

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`LinkSync Backend running on http://localhost:${PORT}`);
});
