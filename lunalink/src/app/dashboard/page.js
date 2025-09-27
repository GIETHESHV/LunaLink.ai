"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Clock,
  MoreHorizontal,
  Copy,
  Download,
  Share,
  Zap,
  Sun,
  Moon,
  Search,
  Cpu,
  Activity,
  Wifi,
  Battery,
  Volume2,
  ArrowUp,
  Paperclip,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-guard"
import Image from "next/image"
import dynamic from 'next/dynamic';

const Mic = dynamic(() => import('lucide-react').then((mod) => mod.Mic), { ssr: false });
const MicOff = dynamic(() => import('lucide-react').then((mod) => mod.MicOff), { ssr: false });

export default function Dashboard() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: "Hello! I'm LunaLink, your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "Welcome Chat",
      lastMessage: "Hello! I'm LunaLink...",
      timestamp: new Date(),
      active: true,
      pinned: true,
    },
    {
      id: 2,
      title: "Project Planning",
      lastMessage: "Let's discuss your project requirements...",
      timestamp: new Date(Date.now() - 3600000),
      pinned: false,
    },
    {
      id: 3,
      title: "Code Review",
      lastMessage: "I can help you review your code...",
      timestamp: new Date(Date.now() - 7200000),
      pinned: false,
    },
    {
      id: 4,
      title: "Data Analysis",
      lastMessage: "Let's analyze your dataset...",
      timestamp: new Date(Date.now() - 10800000),
      pinned: false,
    },
  ])
  const [activeConversation, setActiveConversation] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fileInputRef = useRef(null)
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
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const router = useRouter()
  const { logout } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage, target_language: selectedLanguage }),
      })

      if (!response.ok) {
        throw new Error("API Error")
      }

      const data = await response.json()

      const aiResponse = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      // speakResponse(data.response) // Removed automatic playback
    } catch (error) {
      console.error("Error sending message:", error)
      const errorResponse = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: "New Chat",
      lastMessage: "",
      timestamp: new Date(),
      active: true,
      pinned: false,
    }

    setConversations((prev) => [newConv, ...prev.map((conv) => ({ ...conv, active: false }))])
    setActiveConversation(newConv.id)
    setMessages([
      {
        id: 1,
        type: "assistant",
        content: "Hello! I'm LunaLink, your AI assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ])
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onstart = () => {
      setIsRecording(true)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
    }

    recognitionRef.current.start()
  }

  const speakResponse = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.")
      return
    }
    // Cancel any ongoing speech before starting a new one
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.oncancel = () => setIsSpeaking(false)
    speechSynthesis.speak(utterance)
  }

  const handleToggleSpeech = (text) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      speakResponse(text)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      // Display a message to the user that the file has been processed
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "assistant",
          content: data.message || "File processed successfully! You can now ask questions about its content.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "assistant",
          content: "Error processing file. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openVoiceMode = () => {
    router.push("/voice-mode")
  }

  const openSignLanguageMode = () => {
    router.push("/sign-language")
  }

  const themeClasses = isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"

  const cardClasses = isDarkMode
    ? "bg-gray-800/20 backdrop-blur-2xl border-gray-700/30 shadow-2xl"
    : "bg-white/20 backdrop-blur-2xl border-gray-200/30 shadow-2xl"

  const inputClasses = isDarkMode
    ? "bg-gray-800/30 backdrop-blur-xl border-gray-700/40 text-white placeholder-gray-400"
    : "bg-white/30 backdrop-blur-xl border-gray-300/40 text-gray-900 placeholder-gray-500"

  const messageGlassClasses = isDarkMode
    ? "bg-gray-800/25 backdrop-blur-xl border-gray-700/25 shadow-lg"
    : "bg-white/25 backdrop-blur-xl border-gray-200/25 shadow-lg"

  return (
    <div className={`min-h-screen flex relative overflow-hidden transition-all duration-500 ${themeClasses}`}>
      <div className="fixed inset-0 -z-10">
        {isDarkMode ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>

            {/* Enhanced animated mesh gradient with more complex patterns */}
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
                className="absolute inset-0 bg-gradient-to-t from-cyan-600/20 via-blue-600/20 to-purple-600/20"
                style={{
                  animation: "mesh-gradient 30s ease-in-out infinite",
                  animationDelay: "6s",
                  backgroundSize: "400% 400%",
                }}
              ></div>
            </div>

            {/* Enhanced floating particles with varied animations */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full blur-xl ${
                    i % 5 === 0
                      ? "w-32 h-32 bg-blue-500/15"
                      : i % 5 === 1
                        ? "w-24 h-24 bg-purple-500/15"
                        : i % 5 === 2
                          ? "w-40 h-40 bg-cyan-500/15"
                          : i % 5 === 3
                            ? "w-28 h-28 bg-pink-500/15"
                            : "w-36 h-36 bg-indigo-500/15"
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `particle-float-${(i % 3) + 1} ${8 + Math.random() * 6}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 8}s`,
                    transform: `translate(-50%, -50%)`,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 opacity-20">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{
                    background: `conic-gradient(from ${i * 120}deg, transparent, rgba(0, 122, 255, 0.3), transparent, rgba(88, 86, 214, 0.3), transparent)`,
                    animation: `aurora-wave ${15 + i * 5}s ease-in-out infinite`,
                    animationDelay: `${i * 2}s`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/50 to-purple-50/50"></div>

            {/* Enhanced light theme mesh */}
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
                  backgroundSize: "300% 300%",
                }}
              ></div>
            </div>

            {/* Enhanced light floating elements */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full blur-xl ${
                    i % 4 === 0
                      ? "w-24 h-24 bg-blue-200/25"
                      : i % 4 === 1
                        ? "w-32 h-32 bg-purple-200/25"
                        : i % 4 === 2
                          ? "w-28 h-28 bg-cyan-200/25"
                          : "w-36 h-36 bg-pink-200/25"
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `particle-float-${(i % 3) + 1} ${6 + Math.random() * 4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 6}s`,
                    transform: `translate(-50%, -50%)`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Enhanced grid pattern with subtle animation */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} 1px, transparent 0)`,
              backgroundSize: "40px 40px",
              animationDuration: "8s",
            }}
          ></div>
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 right-0 h-12 ${cardClasses} border-b backdrop-blur-2xl z-50 flex items-center justify-between px-4 shadow-lg`}
      >
        <div className="flex items-center space-x-3">
          {/* macOS window controls */}
          <div className="flex items-center space-x-2">
            <button className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"></button>
            <button className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors"></button>
            <button
              onClick={toggleFullscreen}
              className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
            ></button>
          </div>

          <div className="flex items-center space-x-2">
            <Image src="/lunalink-logo.jpg" alt="LunaLink" width={20} height={20} className="rounded" />
            <span className="text-sm font-medium">LunaLink AI</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <Wifi className="h-3 w-3" />
            <Activity className="h-3 w-3" />
            <Battery className="h-3 w-3" />
            <Volume2 className="h-3 w-3" />
          </div>
          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <button onClick={toggleTheme} className="p-1 rounded hover:bg-gray-200/20 transition-colors">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 ${cardClasses} border-r backdrop-blur-2xl flex flex-col overflow-hidden relative z-10 mt-12 shadow-2xl`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image src="/lunalink-logo.jpg" alt="LunaLink" width={32} height={32} className="rounded-lg" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <div>
                <span className="font-semibold text-sm">LunaLink</span>
                <p className="text-xs opacity-60">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200/10 rounded-md transition-all duration-200"
            >
              <X className="h-4 w-4 opacity-70" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputClasses} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg`}
            />
          </div>

          <button
            onClick={startNewConversation}
            className={`w-full p-3 rounded-lg ${isDarkMode ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-700/80 hover:to-purple-700/80" : "bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80"} backdrop-blur-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-white/10`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {/* Pinned conversations */}
            {conversations.filter((conv) => conv.pinned).length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium opacity-60 px-3 py-2">Pinned</h3>
                {conversations
                  .filter((conv) => conv.pinned)
                  .map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      activeConversation={activeConversation}
                      setActiveConversation={setActiveConversation}
                      isDarkMode={isDarkMode}
                      messageGlassClasses={messageGlassClasses}
                    />
                  ))}
              </div>
            )}

            {/* Recent conversations */}
            <div>
              <h3 className="text-xs font-medium opacity-60 px-3 py-2">Recent</h3>
              {conversations
                .filter((conv) => !conv.pinned)
                .map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    activeConversation={activeConversation}
                    setActiveConversation={setActiveConversation}
                    isDarkMode={isDarkMode}
                    messageGlassClasses={messageGlassClasses}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700/20">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className={`p-2 rounded-lg ${messageGlassClasses} text-center border`}>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="opacity-70">Online</span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${messageGlassClasses} text-center border`}>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="opacity-70">Mistral</span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${messageGlassClasses} text-center border`}>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <Cpu className="h-3 w-3 text-blue-400" />
                <span className="opacity-70">Lama</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 ${isDarkMode ? "bg-gradient-to-r from-blue-500/80 to-purple-600/80" : "bg-gradient-to-r from-blue-400/80 to-purple-500/80"} rounded-full flex items-center justify-center`}
              >
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Hello, Giethu!</p>
                <p className="text-xs opacity-60">Premium Plan</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200">
                <Settings className="h-4 w-4 opacity-60 hover:opacity-90" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4 opacity-60 hover:opacity-90" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 mt-12">
        {/* Chat Header */}
        <div
          className={`h-16 border-b border-gray-700/20 flex items-center justify-between px-6 ${cardClasses} backdrop-blur-2xl shadow-lg`}
        >
          <div className="flex items-center space-x-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200"
              >
                <Menu className="h-5 w-5 opacity-70" />
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h1 className="text-lg font-semibold">LunaLink AI</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-sm opacity-70">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online • GORQ Turbo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openVoiceMode}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                isDarkMode
                  ? "bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-700/80 hover:to-emerald-700/80"
                  : "bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80"
              } backdrop-blur-xl text-white font-medium shadow-lg border border-white/10 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Active Voice Mode</span>
            </button>
            <button
              onClick={openSignLanguageMode}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                isDarkMode
                  ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/80 hover:to-indigo-700/80"
                  : "bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/80 hover:to-indigo-600/80"
              } backdrop-blur-xl text-white font-medium shadow-lg border border-white/10 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Language Model</span>
            </button>
            <button className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200">
              <Share className="h-4 w-4 opacity-70" />
            </button>
            <button className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200">
              <Download className="h-4 w-4 opacity-70" />
            </button>
            <button className="p-2 hover:bg-gray-200/10 rounded-lg transition-all duration-200">
              <MoreHorizontal className="h-4 w-4 opacity-70" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex space-x-3 max-w-3xl ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "user"
                        ? isDarkMode
                          ? "bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-xl border border-white/10"
                          : "bg-gradient-to-r from-blue-400/80 to-purple-500/80 backdrop-blur-xl border border-white/10"
                        : `${messageGlassClasses} border`
                    } shadow-lg`}
                  >
                    {message.type === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-blue-400" />
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.type === "assistant" && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleSpeech(message.content)}
                            className="p-1 hover:bg-gray-200/10 rounded transition-all duration-200"
                          >
                            {isSpeaking ? (
                              <MicOff className="h-3 w-3 opacity-60 text-red-500" />
                            ) : (
                              <Volume2 className="h-3 w-3 opacity-60" />
                            )}
                          </button>
                          <button className="p-1 hover:bg-gray-200/10 rounded transition-all duration-200">
                            <Copy className="h-3 w-3 opacity-60" />
                          </button>
                          <button className="p-1 hover:bg-gray-200/10 rounded transition-all duration-200">
                            <Share className="h-3 w-3 opacity-60" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-3xl">
                  <div
                    className={`w-8 h-8 rounded-full ${messageGlassClasses} border flex items-center justify-center shadow-lg`}
                  >
                    <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                  </div>
                  <div className={`${messageGlassClasses} border p-4 rounded-2xl shadow-lg`}>
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
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`border-t border-gray-700/20 p-6 ${cardClasses} backdrop-blur-2xl shadow-lg`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className={`flex-shrink-0 p-3 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50"} rounded-xl hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 self-end shadow-lg border border-white/10`}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`flex-shrink-0 p-3 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50"} rounded-xl hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 self-end shadow-lg border border-white/10 text-sm`}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleVoiceInput}
                className={`flex-shrink-0 p-3 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50"} rounded-xl hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 self-end shadow-lg border border-white/10`}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message LunaLink..."
                className={`flex-1 resize-none min-h-[52px] max-h-32 rounded-xl border ${inputClasses} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 p-4 shadow-lg`}
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "52px",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px"
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`flex-shrink-0 p-3 ${isDarkMode ? "bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/80 hover:to-purple-700/80" : "bg-gradient-to-r from-blue-400/80 to-purple-500/80 hover:from-blue-500/80 hover:to-purple-600/80"} backdrop-blur-xl text-white rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 self-end shadow-lg border border-white/10`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs opacity-60">LunaLink can make mistakes. Consider checking important information.</p>
              <div className="flex items-center space-x-2 text-xs opacity-60">
                <span>GORQ</span>
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationItem({ conv, activeConversation, setActiveConversation, isDarkMode, messageGlassClasses }) {
  return (
    <div
      onClick={() => setActiveConversation(conv.id)}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group relative shadow-lg ${
        conv.active
          ? isDarkMode
            ? "bg-gray-700/30 backdrop-blur-xl border border-gray-600/40"
            : "bg-gray-200/30 backdrop-blur-xl border border-gray-300/40"
          : "hover:bg-gray-200/10 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <MessageSquare className="h-4 w-4 opacity-60 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{conv.title}</span>
            {conv.pinned && <div className="w-1 h-1 bg-blue-400 rounded-full"></div>}
          </div>
          <p className="text-xs opacity-60 truncate">{conv.lastMessage}</p>
          <div className="flex items-center space-x-1 mt-1">
            <Clock className="h-3 w-3 opacity-40" />
            <span className="text-xs opacity-40">
              {conv.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200/10 rounded transition-all duration-200">
          <MoreHorizontal className="h-3 w-3 opacity-70" />
        </button>
      </div>
    </div>
  )
}
