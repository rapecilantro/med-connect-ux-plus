"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      console.log("Video element found");
      
      // Try to play the video manually after a delay
      const playVideo = async () => {
        try {
          video.load(); // Force reload
          await video.play();
          console.log("Video started playing successfully");
          setVideoLoaded(true);
        } catch (error) {
          console.error("Failed to play video:", error);
          setHasError(true);
        }
      };

      setTimeout(playVideo, 500);
    }
  }, []);

  const handleCanPlay = () => {
    console.log('Video can start playing');
    setVideoLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video failed to load');
    console.error('Error details:', e);
    setHasError(true);
  };

  const handleLoadedData = () => {
    console.log('Video data loaded successfully');
    setVideoLoaded(true);
  };

  // Fallback to image if video fails
  if (hasError) {
    return (
      <div className="mt-16 md:mt-20">
        <div className="relative">
          <Image
            src="/graphics/Screenshot_2025-06-09_11-25-27.png"
            alt="Patient Doctor Finder - Search Interface"
            width={1200}
            height={600}
            className="rounded-xl shadow-2xl mx-auto border-2 border-primary/20 hover:scale-105 transition-transform duration-500"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg font-semibold mb-2">Video Demo Available</p>
              <p className="text-sm">Interactive demo showing how to find doctors for your medications</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 md:mt-20">
      <video
        ref={videoRef}
        src="/graphics/demo-video.mp4"
        width="1200"
        height="600"
        autoPlay
        loop
        muted
        playsInline
        controls
        preload="metadata"
        className="rounded-xl shadow-2xl mx-auto border-2 border-primary/20 hover:scale-105 transition-transform duration-500 w-full max-w-5xl"
        style={{ maxHeight: '600px', objectFit: 'cover' }}
        onError={handleError}
        onLoadStart={() => console.log('Video started loading')}
        onCanPlay={handleCanPlay}
        onLoadedData={handleLoadedData}
        onPlay={() => console.log('Video started playing')}
        onPause={() => console.log('Video paused')}
      >
        <source src="/graphics/demo-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
