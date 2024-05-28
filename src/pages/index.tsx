import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io('http://localhost:80', { withCredentials: true });

export default function Home() {
  let pc: RTCPeerConnection 
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    (async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setLocalStream(localStream)
    })()
    socket.on("broadcast", () => console.log('test'))
  }, [])

  const joinRoom = () => {
    socket.emit('joinRoom', { room: 'testRoom' })
    createPeerConnection()
  }

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        }, {
            urls: 'stun:stun.xten.com',
        }],
     };
    pc = new RTCPeerConnection(configuration);
    
    localStream!.getTracks().forEach(track => pc.addTrack(track, localStream!));
    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      console.log('onIceCandidate => ', candidate);
      socket.emit("connectSignaling", { candidate });
    };
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center">
        <video
          ref={video => {
            if (video) {
              video.srcObject = localStream
            }
          }}
          autoPlay
          playsInline
          muted={true}
        />
        <button 
          onClick={() => {
            joinRoom()
          }}
          disabled={!localStream}
        >
          加入
        </button>
      </div>
    </div>
  );
}
