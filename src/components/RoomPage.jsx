import {useSocket} from '@/context/SocketProvider';
import React, {useCallback, useEffect, useState} from 'react'
import {configuration} from '@/service/peer';
import SimplePeer from 'simple-peer'
import VideoPlayer from "@/components/VideoPlayer";

const RoomPage = () => {
    const socket = useSocket();

    const [myStream, setMyStream] = useState(null);

    let peers = {}
    let localStream = null;

    useEffect(() => {
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

        /////////////////////////////////////////////////////////

        constraints.video.facingMode = {
            ideal: "user"
        }

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            console.log('Received local stream');
            localStream = stream;
            setMyStream(stream);

            init()

        }).catch(e => alert(`getusermedia error ${e.name}`))


    }, []);

    const initReceive = useCallback(async () => {
        console.log('INIT RECEIVE ')

    }, [socket]);

    useEffect(() => {
            socket.on("initReceive", initReceive);

            return () => {
                socket.off("initReceive", initReceive);
            };
        },
        [
            socket,
            initReceive
        ]);





    const init = () => {


      /*  socket.on('initReceive', socket_id => {
            console.log('INIT RECEIVE ' + socket_id)
            addPeer(socket_id, false)

            socket.emit('initSend', socket_id)
        })*/

        socket.on('initSend', socket_id => {
            console.log('INIT SEND ' + socket_id)
            addPeer(socket_id, true)
        })


        socket.on('signal', data => {
            peers[data.socket_id].signal(data.signal)
        })
    }

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
            console.log("socket_id:")
            console.log(socket_id)
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
            {
                myStream &&
                <VideoPlayer stream={myStream} name={"My Stream"} />
            }

            <div id="videos" className="container">
                <video id="localVideo" className="vid" autoPlay muted></video>
            </div>
        </div>

    )
}

export default RoomPage;
