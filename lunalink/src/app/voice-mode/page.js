"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Mic, MicOff, User, Sparkles, Volume2, VolumeX, AlertCircle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function VoiceMode() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: "Hello! I'm ready for voice conversation. Press the microphone button to start speaking.",
      timestamp: new Date(),
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [error, setError] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.9,
    pitch: 1,
    volume: 0.8,
    voice: null,
  })
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("en") // Default to English

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
    { code: "ta", name: "Tamil" },
    // Add more languages as needed, ensure they are supported by Googletrans and Argos Translate
  ]

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const SpeechSynthesis = window.speechSynthesis

      if (!SpeechRecognition) {
        setSpeechSupported(false)
        setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.")
        return
      }

      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setIsRecording(true)
        setError("")
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        handleVoiceInput(transcript)
      }

      recognitionRef.current.onerror = (event) => {
        setIsRecording(false)
        setIsProcessing(false)

        switch (event.error) {
          case "no-speech":
            setError("No speech detected. Please try again.")
            break
          case "audio-capture":
            setError("Microphone access denied. Please allow microphone access.")
            break
          case "not-allowed":
            setError("Microphone access denied. Please allow microphone access and refresh the page.")
            break
          default:
            setError(`Speech recognition error: ${event.error}`)
        }
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }

      // Initialize speech synthesis
      synthRef.current = SpeechSynthesis

      // Load available voices
      const loadVoices = () => {
        const voices = synthRef.current.getVoices()
        setAvailableVoices(voices)

        // Set default voice (prefer English voices)
        const englishVoices = voices.filter((voice) => voice.lang.startsWith("en"))
        if (englishVoices.length > 0 && !voiceSettings.voice) {
          setVoiceSettings((prev) => ({ ...prev, voice: englishVoices[0] }))
        }
      }

      // Load voices immediately and on voiceschanged event
      loadVoices()
      synthRef.current.onvoiceschanged = loadVoices
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const handleVoiceInput = async (transcript) => {
    setIsProcessing(true)
    setError("")

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: transcript,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: transcript,
          target_language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const aiResponse = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsProcessing(false)

      // Speak the response
      speakText(aiResponse.content)
    } catch (err) {
      console.error("Error fetching AI response:", err)
      setError("Failed to get AI response. Please try again.")
      setIsProcessing(false)
    }
  }

  const speakText = (text) => {
    if (!synthRef.current || !speechSupported) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = voiceSettings.rate
    utterance.pitch = voiceSettings.pitch
    utterance.volume = voiceSettings.volume

    if (voiceSettings.voice) {
      utterance.voice = voiceSettings.voice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      setError("Speech recognition is not available.")
      return
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop()
    } else if (!isProcessing) {
      // Start recording
      // Stop any ongoing speech to prevent feedback
      if (synthRef.current) {
        synthRef.current.cancel()
        setIsSpeaking(false)
      }
      setError("")
      try {
        recognitionRef.current.start()
      } catch (err) {
        setError("Failed to start speech recognition. Please try again.")
      }
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const goBack = () => {
    // Stop any ongoing speech or recording
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    router.push("/dashboard")
  }

  const testVoice = () => {
    speakText("Hello! This is how I sound with the current voice settings.")
  }

  const themeClasses = isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"

  const cardClasses = isDarkMode
    ? "bg-gray-800/20 backdrop-blur-2xl border-gray-700/30 shadow-2xl"
    : "bg-white/20 backdrop-blur-2xl border-gray-200/30 shadow-2xl"

  const messageGlassClasses = isDarkMode
    ? "bg-gray-800/25 backdrop-blur-xl border-gray-700/25 shadow-lg"
    : "bg-white/25 backdrop-blur-xl border-gray-200/25 shadow-lg"

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-500 ${themeClasses}`}>
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10">
        {isDarkMode ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>

            {/* Enhanced animated mesh gradient with multiple layers */}
            <div className="absolute inset-0 opacity-40">
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-cyan-600/30"
                style={{
                  animation: "mesh-gradient 20s ease-in-out infinite",
                  backgroundSize: "400% 400%",
                }}
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-l from-purple-600/25 via-pink-600/25 to-blue-600/25"
                style={{
                  animation: "mesh-gradient 25s ease-in-out infinite reverse",
                  animationDelay: "3s",
                  backgroundSize: "400% 400%",
                }}
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20"
                style={{
                  animation: "mesh-gradient 30s ease-in-out infinite",
                  animationDelay: "7s",
                  backgroundSize: "500% 500%",
                }}
              ></div>
            </div>

            {/* Floating particles with enhanced animations */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full blur-xl ${
                    i % 4 === 0
                      ? "w-32 h-32 bg-blue-500/10"
                      : i % 4 === 1
                        ? "w-24 h-24 bg-purple-500/12"
                        : i % 4 === 2
                          ? "w-40 h-40 bg-cyan-500/8"
                          : "w-28 h-28 bg-indigo-500/10"
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `particle-float-${(i % 3) + 1} ${8 + Math.random() * 8}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 10}s`,
                    transform: `translate(-50%, -50%)`,
                  }}
                />
              ))}
            </div>

            {/* Subtle aurora waves */}
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
                style={{
                  animation: "aurora-wave 15s ease-in-out infinite",
                  transform: "rotate(-45deg) scale(2)",
                }}
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/25 to-transparent"
                style={{
                  animation: "aurora-wave 18s ease-in-out infinite reverse",
                  animationDelay: "5s",
                  transform: "rotate(45deg) scale(2)",
                }}
              ></div>
            </div>

            {/* Breathing light effect */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                style={{
                  animation: "breathe 12s ease-in-out infinite",
                }}
              ></div>
              <div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
                style={{
                  animation: "breathe 15s ease-in-out infinite",
                  animationDelay: "4s",
                }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/50 to-purple-50/50"></div>

            {/* Light mode enhanced animations */}
            <div className="absolute inset-0 opacity-30">
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-200/40 via-purple-200/40 to-cyan-200/40"
                style={{
                  animation: "mesh-gradient 18s ease-in-out infinite",
                  backgroundSize: "300% 300%",
                }}
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-l from-purple-200/30 via-pink-200/30 to-blue-200/30"
                style={{
                  animation: "mesh-gradient 22s ease-in-out infinite reverse",
                  animationDelay: "2s",
                  backgroundSize: "350% 350%",
                }}
              ></div>
            </div>

            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full blur-xl ${
                    i % 3 === 0
                      ? "w-24 h-24 bg-blue-200/20"
                      : i % 3 === 1
                        ? "w-32 h-32 bg-purple-200/18"
                        : "w-28 h-28 bg-cyan-200/22"
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `particle-float-${(i % 3) + 1} ${6 + Math.random() * 6}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 8}s`,
                    transform: `translate(-50%, -50%)`,
                  }}
                />
              ))}
            </div>

            {/* Light mode breathing effect */}
            <div className="absolute inset-0 opacity-15">
              <div
                className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-300/25 rounded-full blur-3xl"
                style={{
                  animation: "breathe 10s ease-in-out infinite",
                }}
              ></div>
              <div
                className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-purple-300/25 rounded-full blur-3xl"
                style={{
                  animation: "breathe 13s ease-in-out infinite",
                  animationDelay: "3s",
                }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Header */}
      <div className={`${cardClasses} border-b backdrop-blur-2xl shadow-lg relative z-10`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200">
              <ArrowLeft className="h-5 w-5 opacity-70" />
            </button>
            <div className="flex items-center space-x-3">
              <Image src="/lunalink-logo.jpg" alt="LunaLink" width={32} height={32} className="rounded-lg" />
              <div>
                <h1 className="text-lg font-semibold">Active Voice Mode</h1>
                <p className="text-sm opacity-60">Speak naturally with LunaLink</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200"
            >
              <Settings className="h-5 w-5 opacity-70" />
            </button>
            <div className="flex items-center space-x-2 text-sm opacity-70">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${speechSupported ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span>{speechSupported ? "Voice Ready" : "Voice Unavailable"}</span>
            </div>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <VolumeX className="h-4 w-4" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showSettings && (
        <div className={`${cardClasses} border-b backdrop-blur-2xl shadow-lg relative z-10`}>
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Voice Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${isDarkMode ? "bg-gray-800/30 border-gray-700/40 text-white" : "bg-white/30 border-gray-300/40 text-gray-900"} backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Voice</label>
                <select
                  value={voiceSettings.voice?.name || ""}
                  onChange={(e) => {
                    const selectedVoice = availableVoices.find((voice) => voice.name === e.target.value)
                    setVoiceSettings((prev) => ({ ...prev, voice: selectedVoice }))
                  }}
                  className={`w-full p-2 rounded-lg border ${isDarkMode ? "bg-gray-800/30 border-gray-700/40 text-white" : "bg-white/30 border-gray-300/40 text-gray-900"} backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                >
                  {availableVoices
                    .filter((voice) => voice.lang.startsWith("en"))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium mb-2">Speed: {voiceSettings.rate.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings((prev) => ({ ...prev, rate: Number.parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Pitch */}
              <div>
                <label className="block text-sm font-medium mb-2">Pitch: {voiceSettings.pitch.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings((prev) => ({ ...prev, pitch: Number.parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volume: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => setVoiceSettings((prev) => ({ ...prev, volume: Number.parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={testVoice}
                disabled={isSpeaking}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode ? "bg-blue-600/80 hover:bg-blue-700/80" : "bg-blue-500/80 hover:bg-blue-600/80"
                } backdrop-blur-xl text-white font-medium shadow-lg border border-white/10 disabled:opacity-50`}
              >
                Test Voice
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-200/10 text-sm"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`${cardClasses} border-l-4 border-red-500 m-4 p-4 backdrop-blur-2xl`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex space-x-3 max-w-3xl w-full sm:max-w-2xl ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user"
                      ? isDarkMode
                        ? "bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-xl border border-white/10"
                        : "bg-gradient-to-r from-blue-400/80 to-purple-500/80 backdrop-blur-xl border border-white/10"
                      : `${messageGlassClasses} border`
                  } shadow-lg`}
                >
                  {message.type === "user" ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  )}
                </div>

                <div className={`flex-1 ${message.type === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                      message.type === "user"
                        ? isDarkMode
                          ? "bg-gradient-to-r from-blue-600/70 to-purple-600/70 backdrop-blur-xl text-white border border-white/10"
                          : "bg-gradient-to-r from-blue-500/70 to-purple-500/70 backdrop-blur-xl text-white border border-white/10"
                        : `${messageGlassClasses} border`
                    }`}
                  >
                    <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.type === "assistant" && (
                      <button
                        onClick={() => speakText(message.content)}
                        disabled={isSpeaking}
                        className="p-1 hover:bg-gray-200/10 rounded transition-all duration-200 disabled:opacity-50"
                      >
                        <Volume2 className="h-3 w-3 opacity-60" />
                      </button>
                    )}
                    {message.type === "assistant" && isSpeaking && (
                      <div className="flex items-center space-x-1 text-xs text-blue-400">
                        <Volume2 className="h-3 w-3 animate-pulse" />
                        <span>Speaking</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-center">
              <div className={`${messageGlassClasses} border p-4 rounded-2xl shadow-lg`}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className={`w-2 h-2 ${isDarkMode ? "bg-white/50" : "bg-gray-500/50"} rounded-full animate-bounce`}
                    ></div>
                    <div
                      className={`w-2 h-2 ${isDarkMode ? "bg-white/50" : "bg-gray-500/50"} rounded-full animate-bounce`}
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className={`w-2 h-2 ${isDarkMode ? "bg-white/50" : "bg-gray-500/50"} rounded-full animate-bounce`}
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm opacity-70">Processing voice...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Control */}
      <div className={`${cardClasses} border-t backdrop-blur-2xl shadow-lg relative z-10`}>
        <div className="p-6 sm:p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <button
                onClick={toggleRecording}
                disabled={isProcessing || !speechSupported}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-300 shadow-2xl border-4 ${
                  !speechSupported
                    ? "bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400/50 opacity-50 cursor-not-allowed"
                    : isRecording
                      ? "bg-gradient-to-r from-red-500 to-red-600 border-red-400/50 scale-110"
                      : isProcessing
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400/50 opacity-50 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/50 hover:scale-105 active:scale-95"
                } backdrop-blur-xl`}
              >
                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse"></div>
                  </>
                )}
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : isRecording ? (
                  <MicOff className="h-8 w-8 sm:h-10 sm:w-10 text-white mx-auto" />
                ) : (
                  <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-white mx-auto" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-lg sm:text-xl font-semibold">
                {!speechSupported
                  ? "Voice Unavailable"
                  : isRecording
                    ? "Listening..."
                    : isProcessing
                      ? "Processing..."
                      : "Tap to Speak"}
              </p>
              <p className="text-sm opacity-60">
                {!speechSupported
                  ? "Speech recognition is not supported in this browser"
                  : isRecording
                    ? "Speak clearly, tap again when finished"
                    : isProcessing
                      ? "Converting speech to text..."
                      : "Press the microphone to start voice conversation"}
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500/50"}`}
                ></div>
                <span className="opacity-70">Mic {isRecording ? "ON" : "OFF"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-blue-500 animate-pulse" : "bg-gray-500/50"}`}
                ></div>
                <span className="opacity-70">Speaker {isSpeaking ? "ON" : "OFF"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}