import {useSocket} from '@/context/SocketProvider';
import React, {useEffect, useState} from 'react';
import RoomPage from "@/components/RoomPage";

const LobbyScreen = () => {
    const [showPage, setShowPage] = useState(false);
    const socket = useSocket();

    useEffect(() => {
        socket.emit('room:join', {email: Math.random(), room: 1});
        socket.on("room:join", () => setShowPage(true));
    }, []);

    return (
        showPage && <RoomPage></RoomPage>
    )
}

export default LobbyScreen
