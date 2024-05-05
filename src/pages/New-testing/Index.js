import React, { useEffect, useRef } from 'react';

function CameraPage() {
  const videoRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          console.log('Camera video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        };
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    };

    initCamera();
  }, []);

  return (
    <div>
      <h1>Camera Video Size Example</h1>
      <video ref={videoRef} autoPlay playsInline></video>
    </div>
  );
}

export default CameraPage;
