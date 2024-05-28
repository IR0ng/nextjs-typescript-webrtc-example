import { Inter } from "next/font/google";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  useEffect(() => {
    (async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setLocalStream(localStream)
      console.log('here')
    })()
  }, [])
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
      </div>
    </div>
  );
}
