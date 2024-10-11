
export const configuration = {
    iceServers: [{
        urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
        ]
    }]
}

class PeerService {
    constructor() {
        if (typeof window !== 'undefined' && !this.peer) {
            this.peer = new RTCPeerConnection(configuration)
        }
    }

    setLocalDescription = async (ans) => {
        if (this.peer) {
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        }
    }

    getAnswer = async (offer) => {
        if (this.peer) {
            await this.peer.setRemoteDescription(offer);
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));
            return ans;
        }
    }

    getOffer = async () => {
        if (this.peer) {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }
    }


}

export default new PeerService();
