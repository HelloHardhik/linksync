export default {
    async fetch(request, env) {
        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Expected Upgrade: websocket", { status: 426 });
        }

        const [client, server] = new WebSocketPair();
        await this.handleSession(server);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    },

    // In-memory queue (Note: this works best with Durable Objects, 
    // but for a simple demo, we'll use a global variable in the worker instance)
    waitingUsers: [],

    async handleSession(ws) {
        ws.accept();
        let currentUser = null;

        ws.addEventListener("message", async (msg) => {
            try {
                const data = JSON.parse(msg.data);

                if (data.type === "start-search") {
                    currentUser = { ws, peerId: data.peerId, data: data };

                    // Look for match
                    const partnerIndex = this.waitingUsers.findIndex(u => u.ws.readyState === 1);

                    if (partnerIndex !== -1) {
                        const partner = this.waitingUsers.splice(partnerIndex, 1)[0];

                        // Notify both
                        ws.send(JSON.stringify({
                            type: "match-found",
                            partnerPeerId: partner.peerId,
                            role: "caller"
                        }));

                        partner.ws.send(JSON.stringify({
                            type: "match-found",
                            partnerPeerId: currentUser.peerId,
                            role: "receiver"
                        }));
                    } else {
                        this.waitingUsers.push(currentUser);
                    }
                }

                if (data.type === "stop-search") {
                    this.removeFromQueue(ws);
                }
            } catch (e) {
                console.error("Worker error:", e);
            }
        });

        ws.addEventListener("close", () => {
            this.removeFromQueue(ws);
        });
    },

    removeFromQueue(ws) {
        this.waitingUsers = this.waitingUsers.filter(u => u.ws !== ws);
    }
};
