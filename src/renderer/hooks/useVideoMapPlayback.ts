import { useEffect, useMemo, useRef, useState } from "react";
import { formatVideoDebug, shouldPrepareVideoBuffer, shouldRestartVideo } from "../canvas/map/videoMap";

interface UseVideoMapPlaybackOptions {
  assetUrl: string | null;
  isVideoMap: boolean;
  paused: boolean;
}

export function useVideoMapPlayback({ assetUrl, isVideoMap, paused }: UseVideoMapPlaybackOptions) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const activeVideoIndexRef = useRef(0);
  const [videoDebug, setVideoDebug] = useState("");
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [preparedVideoIndex, setPreparedVideoIndex] = useState<number | null>(null);
  const [videoBufferKeys, setVideoBufferKeys] = useState<[number, number]>([0, 0]);

  const videoUrls = useMemo(() => {
    return isVideoMap && assetUrl
      ? [`${assetUrl}?buffer=0&take=${videoBufferKeys[0]}#t=0.05`, `${assetUrl}?buffer=1&take=${videoBufferKeys[1]}#t=0.05`]
      : [];
  }, [assetUrl, isVideoMap, videoBufferKeys]);

  useEffect(() => {
    activeVideoIndexRef.current = activeVideoIndex;
  }, [activeVideoIndex]);

  useEffect(() => {
    setActiveVideoIndex(0);
    activeVideoIndexRef.current = 0;
    setPreparedVideoIndex(null);
    setVideoBufferKeys([0, 0]);
  }, [assetUrl]);

  useEffect(() => {
    if (!isVideoMap) {
      return;
    }

    if (paused) {
      videoRefs.current.forEach((video) => video?.pause());
      return;
    }

    let statusTicks = 0;
    let pausedTicks = 0;

    const swapVideos = (currentIndex: number) => {
      const nextIndex = currentIndex === 0 ? 1 : 0;
      const currentVideo = videoRefs.current[currentIndex];
      const nextVideo = videoRefs.current[nextIndex];
      if (!currentVideo || !nextVideo) {
        return;
      }

      if (nextVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          currentVideo.currentTime = 0.05;
          void currentVideo.play();
        } catch {
          // If the fallback seek fails, the next interval will try again.
        }
        return;
      }

      try {
        nextVideo.currentTime = 0.05;
      } catch {
        // Reuse the preloaded frame if a fresh seek is rejected.
      }
      void nextVideo.play();
      activeVideoIndexRef.current = nextIndex;
      setActiveVideoIndex(nextIndex);
      setPreparedVideoIndex(null);

      setVideoBufferKeys((keys) => {
        const nextKeys: [number, number] = [...keys];
        nextKeys[currentIndex] += 1;
        return nextKeys;
      });
    };

    const monitorPlayback = () => {
      const currentIndex = activeVideoIndexRef.current;
      const video = videoRefs.current[currentIndex];
      if (!video) {
        return;
      }
      const nearEnd = shouldRestartVideo(video);
      const nextIndex = currentIndex === 0 ? 1 : 0;
      const isPlayablePause = video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      pausedTicks = isPlayablePause && !nearEnd ? pausedTicks + 1 : 0;
      statusTicks += 1;

      if (shouldPrepareVideoBuffer(video)) {
        setPreparedVideoIndex(nextIndex);
      }

      if (statusTicks % 5 === 0) {
        setVideoDebug(formatVideoDebug(videoRefs.current, currentIndex));
      }

      if (nearEnd) {
        pausedTicks = 0;
        const nextVideo = videoRefs.current[nextIndex];
        if (nextVideo && nextVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          swapVideos(currentIndex);
        } else {
          try {
            video.currentTime = 0.05;
            void video.play();
          } catch {
            // If the just-in-time buffer is not ready, keep the active video alive.
          }
        }
      } else if (isPlayablePause) {
        const playPromise = video.play();
        void playPromise.catch(() => {
          window.setTimeout(() => void video.play(), 80);
        });
        if (pausedTicks > 6) {
          void video.play();
          pausedTicks = 0;
        }
      }
    };

    const activeVideo = videoRefs.current[activeVideoIndexRef.current];
    videoRefs.current.forEach((video) => {
      if (video) {
        video.loop = false;
      }
    });
    if (activeVideo) {
      void activeVideo.play();
    }
    const interval = window.setInterval(monitorPlayback, 120);

    return () => {
      window.clearInterval(interval);
      setVideoDebug("");
    };
  }, [assetUrl, isVideoMap, paused]);

  const playActiveWhenReady = (index: number) => {
    if (!paused && index === activeVideoIndexRef.current) {
      void videoRefs.current[index]?.play();
    }
  };

  const recoverUnexpectedPause = (index: number) => {
    const video = videoRefs.current[index];
    if (!paused && index === activeVideoIndexRef.current && video && !shouldRestartVideo(video)) {
      window.setTimeout(() => {
        const latestVideo = videoRefs.current[index];
        if (latestVideo && latestVideo.paused && latestVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          void latestVideo.play();
        }
      }, 50);
    }
  };

  return {
    activeVideoIndex,
    preparedVideoIndex,
    videoDebug,
    videoRefs,
    videoUrls,
    playActiveWhenReady,
    recoverUnexpectedPause
  };
}
