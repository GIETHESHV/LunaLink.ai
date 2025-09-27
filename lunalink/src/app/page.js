"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  Globe,
  Users,
  Award,
  Zap,
  Star,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Clock,
  MapPin,
  Smartphone,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-guard"
import Image from "next/image"

const authFunctions = {
  signInWithEmail: async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Email sign in:", { email, password })
    if (!email.includes("@")) {
      throw new Error("Please enter a valid email address")
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }
    return { success: true, user: { email } }
  },
}

const getPasswordStrength = (password) => {
  if (password.length === 0) return { strength: 0, label: "", color: "" }
  if (password.length < 6) return { strength: 1, label: "Weak", color: "text-red-400" }
  if (password.length < 8) return { strength: 2, label: "Fair", color: "text-yellow-400" }
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { strength: 4, label: "Strong", color: "text-green-400" }
  }
  return { strength: 3, label: "Good", color: "text-blue-400" }
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: "", color: "" })

  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(formData.password))
  }, [formData.password])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAuth = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await authFunctions.signInWithEmail(formData.email, formData.password)
      if (result.success) {
        login()
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setErrors({ general: error instanceof Error ? error.message : "Authentication failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading && formData.email && formData.password) {
      handleAuth()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="absolute top-6 left-6 flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-white/60 text-sm section-glow">
          <Shield className="h-4 w-4" />
          <span>256-bit SSL Encrypted</span>
        </div>
        <div className="flex items-center space-x-2 text-white/60 text-sm section-glow">
          <Globe className="h-4 w-4" />
          <span>Global CDN Protected</span>
        </div>
        <div className="flex items-center space-x-2 text-white/60 text-sm section-glow">
          <Clock className="h-4 w-4" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex items-center space-x-4"></div>

      {/* Left side - Enhanced LunaLink branding */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="logo-glow hover:scale-110 cursor-pointer group">
          <Image
            src="/lunalink-logo.jpg"
            alt="LunaLink Logo"
            width={180}
            height={180}
            className="rounded-3xl group-hover:shadow-2xl group-hover:shadow-blue-500/30"
            priority
          />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white tracking-tight text-glow">LunaLink</h1>
          <p className="text-xl text-white/70 max-w-lg leading-relaxed section-glow">
            Your intelligent AI companion for seamless conversations and limitless possibilities
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6 max-w-md mx-auto">
            <div className="stats-glow p-4 rounded-2xl text-center">
              <div className="flex items-center justify-center space-x-2 text-white/80 text-sm">
                <Users className="h-4 w-4 text-green-400" />
                <span>Seamless Integration</span>
              </div>
            </div>
            <div className="stats-glow p-4 rounded-2xl text-center">
              <div className="flex items-center justify-center space-x-2 text-white/80 text-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>24/7 Availability</span>
              </div>
            </div>
            <div className="stats-glow p-4 rounded-2xl text-center">
              <div className="flex items-center justify-center space-x-2 text-white/80 text-sm">
                <Award className="h-4 w-4 text-purple-400" />
                <span>Customizable & Flexible</span>
              </div>
            </div>
            <div className="stats-glow p-4 rounded-2xl text-center">
              <div className="flex items-center justify-center space-x-2 text-white/80 text-sm">
                <Star className="h-4 w-4 text-orange-400" />
                <span>Free for Early Users</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 glass-card rounded-2xl max-w-md mx-auto">
            <p className="text-white/80 text-sm italic">
              " I think chatbots are the future of engagement between a fan and a brand or celebrity.”
            </p>
            <p className="text-white/60 text-xs mt-2">- Christina Milan (Forbes)</p>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced premium login form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2 section-glow mt-6">
              <h2 className="text-xl font-semibold text-white text-glow">Welcome to LunaLink</h2>
              <p className="text-white/60 text-xs">Sign in to continue to your AI dashboard</p>
              <div className="flex items-center justify-center space-x-2 text-white/40 text-xs">
                <MapPin className="h-3 w-3" />
                <span>Secure login from your location</span>
              </div>
            </div>

            {errors.general && (
              <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl section-glow">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{errors.general}</span>
              </div>
            )}

            <div className="space-y-5" onKeyPress={handleKeyPress}>
              <div className="relative section-glow">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className={`premium-input w-full pr-12 ${errors.email ? "border-red-500/50" : formData.email && /\S+@\S+\.\S+/.test(formData.email) ? "border-green-500/50" : ""}`}
                  aria-label="Email address"
                  autoComplete="email"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  )}
                  <Mail className="h-5 w-5 text-white/50" />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="relative section-glow">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    className={`premium-input w-full pr-24 ${errors.password ? "border-red-500/50" : ""}`}
                    aria-label="Password"
                    autoComplete="current-password"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/50 hover:text-white/70 transition-colors flex-shrink-0"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Lock className="h-4 w-4 text-white/50 flex-shrink-0" />
                  </div>
                </div>

                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">Password strength:</span>
                      <span className={`text-xs ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 1
                            ? "bg-red-400 w-1/4"
                            : passwordStrength.strength === 2
                              ? "bg-yellow-400 w-2/4"
                              : passwordStrength.strength === 3
                                ? "bg-blue-400 w-3/4"
                                : passwordStrength.strength === 4
                                  ? "bg-green-400 w-full"
                                  : "w-0"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between section-glow">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                    Remember me for 30 days
                  </span>
                </label>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="premium-link text-sm hover:text-blue-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleAuth}
                disabled={isLoading || !formData.email || !formData.password}
                className="premium-button w-full group relative overflow-hidden"
                aria-label="Sign in to your account"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-3">
                  <button className="social-button p-3" aria-label="Continue with biometric">
                    <div className="flex flex-col items-center space-y-1">
                      <Smartphone className="h-5 w-5 text-white/70" />
                      <span className="text-white/70 text-xs">Touch ID</span>
                    </div>
                  </button>
                  <button className="social-button p-3" aria-label="Continue with QR code">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-5 h-5 border border-white/70 rounded"></div>
                      <span className="text-white/70 text-xs">QR Code</span>
                    </div>
                  </button>
                  <button className="social-button p-3" aria-label="Continue with SSO">
                    <div className="flex flex-col items-center space-y-1">
                      <Shield className="h-5 w-5 text-white/70" />
                      <span className="text-white/70 text-xs">SSO</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="relative section-glow">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-black/50 px-4 py-1 rounded-full text-white/60 text-xs">or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <button className="social-button group" aria-label="Continue with Google">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-red-500">G</span>
                      </div>
                      <span className="text-white text-sm font-medium group-hover:text-white/90">Google</span>
                    </div>
                  </button>
                  <button className="social-button group" aria-label="Continue with Apple">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 text-white/70 group-hover:text-white/90">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-medium group-hover:text-white/90">Apple</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-3">
                  <button className="social-button p-3 group" aria-label="Continue with GitHub">
                    <div className="flex items-center justify-center">
                      <Github className="h-5 w-5 text-white/70 group-hover:text-white/90" />
                    </div>
                  </button>
                  <button className="social-button p-3 group" aria-label="Continue with Twitter">
                    <div className="flex items-center justify-center">
                      <Twitter className="h-5 w-5 text-white/70 group-hover:text-white/90" />
                    </div>
                  </button>
                  <button className="social-button p-3 group" aria-label="Continue with LinkedIn">
                    <div className="flex items-center justify-center">
                      <Linkedin className="h-5 w-5 text-white/70 group-hover:text-white/90" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-center section-glow">
                  <span className="text-white/60 text-sm">
                    New to LunaLink?{" "}
                    <button
                      onClick={() => setShowCreateAccount(true)}
                      className="premium-link font-medium hover:text-blue-400 transition-colors"
                    >
                      Create your account
                    </button>
                  </span>
                </div>

                <div className="flex justify-center section-glow">
                  <button className="text-white/50 text-xs hover:text-white/70 transition-colors flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Enterprise Login</span>
                  </button>
                </div>

                <div className="flex justify-center">
                  <div className="grid grid-cols-2 gap-4 text-xs text-white/40 section-glow max-w-xs">
                    <div className="space-y-1 text-center">
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        Terms of Service
                      </a>
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        Privacy Policy
                      </a>
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        Cookie Policy
                      </a>
                    </div>
                    <div className="space-y-1 text-center">
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        Help Center
                      </a>
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        Contact Support
                      </a>
                      <a href="#" className="hover:text-white/60 transition-colors block">
                        System Status
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-white/30 section-glow pt-2 border-t border-white/10">
                  <p>© 2024 LunaLink AI Technologies, Inc. All rights reserved.</p>
                  <p className="mt-1">Secured by industry-leading encryption</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
