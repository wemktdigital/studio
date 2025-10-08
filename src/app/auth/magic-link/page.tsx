'use client'

import { useState } from 'react'
import { Mail, Loader2, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getMagicLinkService } from '@/lib/services/magic-link-service'

export default function MagicLinkPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const magicLinkService = getMagicLinkService()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await magicLinkService.sendMagicLink(email)

      if (result.success) {
        setIsSuccess(true)
        setErrorMessage('')
      } else {
        setErrorMessage(result.message)
      }
    } catch (error) {
      setErrorMessage('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="w-full max-w-md p-8">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <h1 
                className="text-2xl font-semibold text-slate-900"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                Check your email
              </h1>
              <p 
                className="text-slate-600"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                We sent a magic link to
              </p>
              <p 
                className="text-blue-600 font-medium"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div 
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              <p className="text-sm text-blue-900 font-medium">Next steps:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Open your email inbox</li>
                <li>• Click the magic link</li>
                <li>• You'll be signed in automatically</li>
              </ul>
            </div>

            {/* Resend Button */}
            <button
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              Send to another email
            </button>

            {/* Back Link */}
            <div className="text-center">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="w-full max-w-md p-8">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h1 
              className="text-3xl font-bold text-slate-900"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              Sign in with email
            </h1>
            <p 
              className="text-slate-600"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              We'll send you a magic link for a password-free sign in
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-slate-700"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 placeholder-slate-400"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.06em'
                  }}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div 
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send magic link
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span 
                className="px-4 bg-white text-slate-500"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.06em'
                }}
              >
                or
              </span>
            </div>
          </div>

          {/* Alternative Login */}
          <div className="text-center">
            <Link 
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              Sign in with password instead
            </Link>
          </div>

          {/* Back Link */}
          <div className="text-center pt-4 border-t border-slate-200">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div 
          className="mt-6 text-center text-sm text-slate-600"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.06em'
          }}
        >
          <p>Don't see the email? Check your spam folder</p>
        </div>
      </div>
    </div>
  )
}

