"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, AlertTriangle, Repeat, PictureInPicture } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import Hls from "hls.js"

interface VideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  width?: number | string
  height?: number | string
  onStart?: () => void
  videoId?: string
}

export function VideoPlayer({ src, poster, autoPlay = false, width, height, onStart, videoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasStartedRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [isPip, setIsPip] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null;

    // HLS Support
    if (src && (src.endsWith('.m3u8') || src.includes('m3u8'))) {
        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                enableWorker: true,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error("fatal network error encountered, try to recover");
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error("fatal media error encountered, try to recover");
                            hls?.recoverMediaError();
                            break;
                        default:
                            hls?.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }
    } else if (src) {
        video.src = src;
    }

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = async () => {
        setIsPlaying(true)
        if (!hasStartedRef.current) {
            hasStartedRef.current = true
            
            if (onStart) onStart()
            
            if (videoId) {
                // Check session storage to prevent duplicate views in same session
                const viewedKey = `viewed_${videoId}`
                if (!sessionStorage.getItem(viewedKey)) {
                    try {
                        await supabase.rpc('increment_views', { video_id: videoId })
                        sessionStorage.setItem(viewedKey, 'true')
                    } catch (err) {
                        console.error("Failed to increment views:", err)
                    }
                }
            }
        }
    }
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      setError("视频加载失败，请检查网络或稍后重试")
      setIsPlaying(false)
    }

    const handlePipChange = () => {
        setIsPip(!!document.pictureInPictureElement)
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)
    video.addEventListener("enterpictureinpicture", handlePipChange)
    video.addEventListener("leavepictureinpicture", handlePipChange)

    if (autoPlay) {
      video.play().catch(() => setIsPlaying(false))
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [autoPlay]) // Removed isPlaying dependency to avoid re-binding loop

  const togglePlay = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    
    // Auto-hide controls after 2s if playing
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false)
      }
    }, 2000)

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
        setShowControls(true) // Always show when paused
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
      if (newMuted) {
        setVolume(0)
      } else {
        setVolume(1)
        videoRef.current.volume = 1
      }
    }
  }

  const toggleLoop = () => {
    const newLoop = !isLooping
    setIsLooping(newLoop)
    if (videoRef.current) {
      videoRef.current.loop = newLoop
    }
  }

  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (error) {
      console.error("Failed to toggle Picture-in-Picture:", error)
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handlePlaybackRate = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 2000)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const aspectRatioStyle: React.CSSProperties | undefined = 
    (typeof width === 'number' && typeof height === 'number')
      ? { aspectRatio: `${width}/${height}` }
      : undefined

  return (
    <div 
      className={`relative group bg-black rounded-lg overflow-hidden ${!width ? 'aspect-video' : ''}`}
      style={aspectRatioStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Watermark Overlay */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none select-none opacity-50 text-white font-bold text-sm tracking-wider mix-blend-difference">
        AI VISION
      </div>

      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()} // Disable right click
        controlsList="nodownload" // Chrome attribute to hide download button
      />

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-white text-lg font-medium">{error}</p>
        </div>
      )}

      {/* Center Play Button (if paused) */}
      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-full border border-white/10">
          <Play className="h-12 w-12 text-white fill-white" />
        </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            <div className="text-sm text-white/80 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
                  {playbackRate}x <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem 
                    key={rate}
                    onClick={() => handlePlaybackRate(rate)}
                    className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button 
                onClick={toggleLoop} 
                className={`transition-colors ${isLooping ? 'text-primary' : 'text-white hover:text-primary'}`}
                title="循环播放"
            >
                <Repeat className="h-5 w-5" />
            </button>

            <button 
                onClick={togglePip} 
                className={`transition-colors ${isPip ? 'text-primary' : 'text-white hover:text-primary'}`}
                title="画中画"
            >
                <PictureInPicture className="h-5 w-5" />
            </button>

            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
