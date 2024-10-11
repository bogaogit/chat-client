
import React, {useCallback, useEffect, useState} from 'react'
import SimplePeer from 'simple-peer';
import VideoPlayer from './VideoPlayer';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import {io} from "socket.io-client";

const configuration = {
    // Using From https://www.metered.ca/tools/openrelay/
    "iceServers": [
        {
            urls: "stun:openrelay.metered.ca:80"
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
}

let constraints = {
    audio: true,
    video: {
        width: {
            max: 300
        },
        height: {
            max: 300
        }
    }
}

constraints.video.facingMode = {
    ideal: "user"
}

const RoomPage = () => {
    /**
     * Socket.io socket
     */
    let socket;
    /**
     * The stream object used to send media
     */
    let localStream = null;
    /**
     * All peer connections
     */
    let peers = {}

    const [myStream, setMyStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);


    useEffect(async () => {
        // enabling the camera at startup
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            console.log('Received local stream');


            localStream = stream;

            setMyStream(stream)

            if (!socket) {
                init()
            }


        }).catch(e => alert(`getusermedia error ${e.name}`))
    }, [])

    const init = useCallback(async () => {
        socket = io("chat-server-jrep.onrender.com/")

        socket.on('initReceive', socket_id => {
            console.log('INIT RECEIVE ' + socket_id)
            addPeer(socket_id, false)

            socket.emit('initSend', socket_id)
        })

        socket.on('initSend', socket_id => {
            console.log('INIT SEND ' + socket_id)
            addPeer(socket_id, true)
        })





        socket.on('signal', data => {
            peers[data.socket_id].signal(data.signal)
        })



    }, []);

    const addPeer = (socket_id, am_initiator) => {
        peers[socket_id] = new SimplePeer({
            initiator: am_initiator,
            stream: localStream,
            config: configuration
        })

        peers[socket_id].on('signal', data => {
            socket.emit('signal', {
                signal: data,
                socket_id: socket_id
            })
        })

        peers[socket_id].on('stream', stream => {
            // let newVid = document.createElement('video')
            // newVid.srcObject = stream
            // newVid.id = socket_id
            // newVid.playsinline = false
            // newVid.autoplay = true
            // newVid.className = "vid"
            // videos.appendChild(newVid)
        })
    }


    return (
        <div className='flex flex-col items-center justify-center w-screen h-screen overflow-hidden'>
            <div className="flex flex-col w-full items-center justify-center overflow-hidden">
                {
                    myStream &&
                    <VideoPlayer stream={myStream} name={"My Stream"} />
                }
                {
                    remoteStreams && remoteStreams.length > 0 &&
                    <>
                        {
                            remoteStreams.map(remoteStream => (
                                <VideoPlayer stream={remoteStream} name={"Remote Stream"} />
                            ))
                        }
                    </>

                }
            </div>

        </div>

    )
}

export default RoomPage;
