import {useSocket} from '@/context/SocketProvider';
import React, {useCallback, useEffect, useState} from 'react'
import peer from '@/service/peer';
import VideoPlayer from './VideoPlayer';
import CallIcon from '@mui/icons-material/Call';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callButton, setCallButton] = useState(true);
    const [isSendButtonVisible, setIsSendButtonVisible] = useState(true);

    const handleUserJoined = useCallback(({email, id}) => {
        console.log(`Email ${email} joined the room!`);
        setRemoteSocketId(id);
    }, []);

    const handleIncomingCall = useCallback(async ({from, offer}) => {
        console.log(`handleIncomingCall ${from}`);
        setRemoteSocketId(from);
        //! console.log(`incoming call from ${from} with offer ${offer}`);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        setMyStream(stream);

        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", {to: from, ans});
    }, [socket]);

    const sendStreams = useCallback(() => {
        console.log(`sendStreams`);
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
        setIsSendButtonVisible(false);
    }, [myStream]);

    const handleCallAccepted = useCallback(({from, ans}) => {
        console.log(`handleCallAccepted`);
        peer.setLocalDescription(ans);
        //! console.log("Call Accepted");

        sendStreams();
    }, [sendStreams]);

    const handleNegoNeededIncoming = useCallback(async ({from, offer}) => {
        console.log(`handleNegoNeededIncoming`);
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", {to: from, ans});
    }, [socket]);


    const handleNegoNeeded = useCallback(async () => {
        console.log(`handleNegoNeeded`);
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", {offer, to: remoteSocketId});
    }, [remoteSocketId, socket]);

    const handleNegoFinal = useCallback(async ({ans}) => {
        console.log(`handleNegoFinal`);
        await peer.setLocalDescription(ans);
    }, [])

    useEffect(() => {
        console.log(`* negotiationneeded`);
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);

        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
        }
    }, [handleNegoNeeded]);


    useEffect(() => {
        peer.peer.addEventListener('track', async ev => {
            console.log(`* track`);
            const remoteStream = ev.streams;

            setRemoteStream(remoteStream[0]);
        })
    }, [])

    useEffect(() => {
            socket.on("user:joined", handleUserJoined);
            socket.on("incoming:call", handleIncomingCall);
            socket.on("call:accepted", handleCallAccepted);
            socket.on("peer:nego:needed", handleNegoNeededIncoming);
            socket.on("peer:nego:final", handleNegoFinal);

            return () => {
                socket.off("user:joined", handleUserJoined);
                socket.off("incoming:call", handleIncomingCall);
                socket.off("call:accepted", handleCallAccepted);
                socket.off("peer:nego:needed", handleNegoNeededIncoming);
                socket.off("peer:nego:final", handleNegoFinal);
            };
        },
        [
            socket,
            handleUserJoined,
            handleIncomingCall,
            handleCallAccepted,
            handleNegoNeededIncoming,
            handleNegoFinal
        ]);


    //* for disappearing call button
    useEffect(() => {
        socket.on("call:initiated", ({from}) => {
            if (from === remoteSocketId) {
                setCallButton(false);
            }
        });

        return () => {
            socket.off("call:initiated");
        }
    }, [socket, remoteSocketId]);


    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        //! create offer
        const offer = await peer.getOffer();
        //* send offer to remote user
        socket.emit("user:call", {to: remoteSocketId, offer})
        // set my stream
        setMyStream(stream);

        //* hide the call button
        setCallButton(false);

        //* Inform the remote user to hide their "CALL" button
        socket.emit("call:initiated", {to: remoteSocketId});
    }, [remoteSocketId, socket, callButton]);

    return (
        <div className='flex flex-col items-center justify-center w-screen h-screen overflow-hidden'>
            <title>Room No. </title>
            <h1 className='absolute top-0 left-0 text-5xl
            text-center font-josefin tracking-tighter mt-5 ml-5 mmd:text-xl mxs:text-sm'>Video
                <VideoCallIcon sx={{fontSize: 50, color: 'rgb(30,220,30)'}}/>
                Peers
            </h1>
            <h4 className='font-bold text-xl md:text-2xl
                mmd:text-sm mt-5 mb-4 msm:max-w-[100px] text-center'>
                {remoteSocketId ? "Connected With Remote User!" : "No One In Room"}
            </h4>
            {(remoteStream && remoteSocketId && isSendButtonVisible) &&
                <button className='bg-green-500 hover:bg-green-600' onClick={sendStreams}>
                    Send Stream
                </button>
            }
            {(remoteSocketId && callButton) &&
                (
                    <button className='text-xl bg-green-500 hover:bg-green-600 rounded-3xl'
                            onClick={handleCallUser}
                            style={{display: !remoteStream ? 'block' : 'none'}}>
                        Call <CallIcon fontSize='medium' className=' animate-pulse scale-125'/>
                    </button>
                )
            }
            <div className="flex flex-col w-full items-center justify-center overflow-hidden">
                {
                    myStream &&
                    <VideoPlayer stream={myStream} name={"My Stream"} />
                }
                {
                    remoteStream &&
                    <VideoPlayer stream={remoteStream} name={"Remote Stream"} />
                }
            </div>

        </div>

    )
}

export default RoomPage;
