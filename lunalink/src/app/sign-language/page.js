"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Camera,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Download,
  History,
  BarChart3,
  Lightbulb,
  Globe,
  Trash2,
  Copy,
  CheckCircle,
} from "lucide-react"

export default function SignLanguagePage() {
  const router = useRouter()
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingIntervalRef = useRef(null)

  const [confidence, setConfidence] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("ASL")
  const [translationHistory, setTranslationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [videoQuality, setVideoQuality] = useState("720p")
  const [sessionStats, setSessionStats] = useState({
    totalTranslations: 0,
    averageConfidence: 0,
    sessionTime: 0,
  })
  const [copied, setCopied] = useState(false)
  const sessionStartRef = useRef(new Date())
  const [currentSign, setCurrentSign] = useState("")
  const [currentConfidence, setCurrentConfidence] = useState(0)
  const predictionIntervalRef = useRef(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current)
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraError("")
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Unable to access camera. Please check permissions.")
    }
  }

  const handleRecording = async () => {
    if (!stream) {
      setCameraError("Camera not available")
      return
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current)
        predictionIntervalRef.current = null
      }
      setRecordingTime(0)

      // Add to history with the last prediction
      if (translatedText && translatedText !== "Recording... Processing sign language...") {
        const newTranslation = {
          id: Date.now().toString(),
          text: translatedText,
          confidence: confidence,
          timestamp: new Date(),
          language: selectedLanguage,
        }
        setTranslationHistory((prev) => [newTranslation, ...prev.slice(0, 9)])

        // Update session stats
        setSessionStats((prev) => ({
          totalTranslations: prev.totalTranslations + 1,
          averageConfidence: Math.round(
            (prev.averageConfidence * prev.totalTranslations + confidence) / (prev.totalTranslations + 1),
          ),
          sessionTime: Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000),
        }))
      }
    } else {
      // Start recording
      try {
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.start()
        setIsRecording(true)
        setTranslatedText("Recording... Processing sign language...")

        // Start recording timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)

        // Start real-time prediction
        predictionIntervalRef.current = setInterval(async () => {
          if (videoRef.current) {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(videoRef.current, 0, 0)
            canvas.toBlob(async (blob) => {
              const formData = new FormData()
              formData.append('file', blob, 'frame.jpg')
              try {
                const response = await fetch('http://localhost:8000/predict_sign', {
                  method: 'POST',
                  body: formData
                })
                const result = await response.json()
                setCurrentSign(result.sign)
                setCurrentConfidence(result.confidence)
                setTranslatedText(result.sign)
                setConfidence(result.confidence)
              } catch (error) {
                console.error('Prediction error:', error)
              }
            }, 'image/jpeg')
          }
        }, 500)

        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            handleRecording()
          }
        }, 10000)
      } catch (error) {
        console.error("Error starting recording:", error)
        setCameraError("Unable to start recording")
      }
    }
  }

  const handleReadAloud = () => {
    if (!translatedText.trim()) return

    if (isSpeaking) {
      // Stop current speech
      speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      // Start speech
      const utterance = new SpeechSynthesisUtterance(translatedText)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.oncancel = () => setIsSpeaking(false)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const copyToClipboard = async () => {
    if (!translatedText.trim()) return
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  const exportTranslation = () => {
    if (!translatedText.trim()) return
    const blob = new Blob([translatedText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sign-language-translation-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    setTranslationHistory([])
  }

  const getQualityConstraints = (quality) => {
    switch (quality) {
      case "480p":
        return { width: 640, height: 480 }
      case "720p":
        return { width: 1280, height: 720 }
      case "1080p":
        return { width: 1920, height: 1080 }
      default:
        return { width: 1280, height: 720 }
    }
  }

  const updateVideoQuality = async (quality) => {
    setVideoQuality(quality)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    try {
      const constraints = getQualityConstraints(quality)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error updating video quality:", error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 p-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"
            style={{
              animation: "mesh-gradient 20s ease-in-out infinite",
              backgroundSize: "400% 400%",
            }}
          ></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 hover:bg-gray-700/30 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Sign Language Recognition</h1>
              <p className="text-gray-300 text-sm mt-1">Powered by LunaLink AI • {selectedLanguage} Model</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 hover:bg-gray-700/30 text-white"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 hover:bg-gray-700/30 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-gray-300 text-sm">Translations</p>
                <p className="text-white font-semibold">{sessionStats.totalTranslations}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-gray-300 text-sm">Avg Confidence</p>
                <p className="text-white font-semibold">{sessionStats.averageConfidence}%</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-gray-300 text-sm">Language</p>
                <p className="text-white font-semibold">{selectedLanguage}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-4">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-gray-300 text-sm">Quality</p>
                <p className="text-white font-semibold">{videoQuality}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left side - Video feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Live Camera Feed
                </h2>
                <Badge variant="outline" className="bg-green-600/20 border-green-500/30 text-green-300">
                  {videoQuality} • {selectedLanguage}
                </Badge>
              </div>

              <div className="relative">
                <div className="aspect-video bg-gray-900/50 rounded-xl overflow-hidden border-2 border-gray-700/30">
                  {cameraError ? (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <div className="space-y-3">
                        <Camera className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-red-400 text-sm">{cameraError}</p>
                        <Button
                          onClick={initializeCamera}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50"
                        >
                          Retry Camera
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}

                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">REC {formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleRecording}
                  disabled={!!cameraError}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      : "bg-red-600 hover:bg-red-700 text-white hover:scale-105"
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                      REC
                    </div>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-300 text-sm">
                  {isRecording
                    ? "Recording your sign language... Maximum 10 seconds"
                    : "Click REC to start recording your sign language"}
                </p>
              </div>
            </Card>
          </div>

          {/* Right side - Translation output and controls */}
          <div className="space-y-6">
            <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Translation
                </h2>

                {confidence > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Confidence:</span>
                    <Badge
                      variant="outline"
                      className={`${
                        confidence >= 90
                          ? "bg-green-600/20 border-green-500/30 text-green-300"
                          : confidence >= 70
                            ? "bg-yellow-600/20 border-yellow-500/30 text-yellow-300"
                            : "bg-red-600/20 border-red-500/30 text-red-300"
                      }`}
                    >
                      {confidence}%
                    </Badge>
                  </div>
                )}
              </div>

              {confidence > 0 && (
                <div className="mb-4">
                  <Progress value={confidence} className="h-2 bg-gray-700/50" />
                </div>
              )}

              <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 min-h-[200px] border border-gray-700/20">
                {translatedText ? (
                  <p className="text-white text-lg leading-relaxed">{translatedText}</p>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center space-y-2">
                      <Mic className="w-8 h-8 mx-auto opacity-50" />
                      <p>Translated text will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={handleReadAloud}
                  disabled={!translatedText.trim() || translatedText.includes("Recording...")}
                  variant="outline"
                  size="sm"
                  className={`bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-all duration-200 ${
                    isSpeaking ? "animate-pulse" : ""
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Read Aloud
                    </>
                  )}
                </Button>

                <Button
                  onClick={copyToClipboard}
                  disabled={!translatedText.trim()}
                  variant="outline"
                  size="sm"
                  className="bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 hover:text-green-200 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  onClick={exportTranslation}
                  disabled={!translatedText.trim()}
                  variant="outline"
                  size="sm"
                  className="bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {showHistory && (
              <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Translations
                  </h3>
                  {translationHistory.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="outline"
                      size="sm"
                      className="bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {translationHistory.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No translations yet</p>
                  ) : (
                    translationHistory.map((translation) => (
                      <div key={translation.id} className="bg-gray-900/30 rounded-lg p-3 border border-gray-700/20">
                        <p className="text-white text-sm mb-2">{translation.text}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{translation.timestamp.toLocaleTimeString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {translation.confidence}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {showSettings && (
              <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Sign Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="ASL">ASL (American)</option>
                      <option value="BSL">BSL (British)</option>
                      <option value="JSL">JSL (Japanese)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Video Quality</label>
                    <select
                      value={videoQuality}
                      onChange={(e) => updateVideoQuality(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="480p">480p (Standard)</option>
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card className="bg-gray-800/20 backdrop-blur-xl border-gray-700/30 p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Pro Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-white font-medium">For Best Results:</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Ensure good lighting on your hands</li>
                <li>• Keep hands within the camera frame</li>
                <li>• Sign at a moderate pace</li>
                <li>• Face the camera directly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-medium">Supported Languages:</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• ASL (American Sign Language)</li>
                <li>• BSL (British Sign Language)</li>
                <li>• JSL (Japanese Sign Language)</li>
                <li>• More languages coming soon</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
