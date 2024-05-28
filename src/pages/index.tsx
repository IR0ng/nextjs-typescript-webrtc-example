import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io('signal-server-example-production.up.railway.app/', { withCredentials: true, transports: ["websocket"] });
const room = 'testRoom'
export default function Home() {
  let pc: RTCPeerConnection 
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteList, setRemoteList] = useState<MediaStream[]>([])
  useEffect(() => {
    (async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setLocalStream(localStream)
    })()
  }, [])

  useEffect(() => {
    socket.on("broadcast", () => console.log('test'))
    socket.on('connectSignaling', async ({ room, sdp, candidate }) => {
      console.log('socket signaling res =>', {room, sdp, candidate});
      try {
        if (sdp) {
          console.log('socket sdp => ', sdp);
          await pc.setRemoteDescription(sdp);
          if (pc.remoteDescription && pc.remoteDescription.type === 'offer') {
            const description = await pc.createAnswer();
            await pc.setLocalDescription(description);
            socket.emit('connectSignaling', { room, sdp: pc.localDescription });
        }
        } else if (candidate) {
          console.log('socket candidate =>', candidate);
          pc.addIceCandidate(candidate);
        }
      } catch (error) {
        console.error(error);
      }
    });
  }, [socket])

  const joinRoom = () => {
    socket.emit('joinRoom', { room })
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
      if (candidate) {
        console.log('pc onIceCandidate => ', candidate);
        socket.emit("connectSignaling", { room, candidate });
      }
    };
    pc.onnegotiationneeded = async () => {
      try {
        console.log('offer send');
        await pc.setLocalDescription(await pc.createOffer());
        socket.emit('connectSignaling', { room, sdp: pc.localDescription });
      } catch (err) {
          console.error(err);
      }
    }
    pc.ontrack = ({ streams }) => {
      console.log('pc streams', streams);
      // setRemoteList(remoteList => [ ...remoteList, streams ])
    }
  };

  return (
    <div className="h-screen bg-white flex">
      <div className="flex flex-col flex-1 gap-2">
        <div className="bg-gray-200 shadow-md p-2">
          <button 
            className="border rounded-xl bg-gray-400 px-3 py-1"
            onClick={() => {
              joinRoom()
            }}
            disabled={!localStream}
          >
            加入
          </button>
        </div>
        <div className="flex-row flex-1 border rounded-xl p-2">
          <video
            className="h-[250px] rounded-xl"
            ref={video => {
              if (video) {
                video.srcObject = localStream
              }
            }}
            autoPlay
            playsInline
            muted={true}
          />
          <div>
            <video
              className="h-[250px] rounded-xl"
              ref={video => {
                if (video) {
                  video.srcObject = localStream
                }
              }}
              autoPlay
              playsInline
              muted={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
