'use client'

import { useCallback, useRef } from 'react'

interface SoundOptions {
  volume?: number
  playbackRate?: number
}

export function useNotificationSounds() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundsRef = useRef<Map<string, AudioBuffer>>(new Map())

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play message notification sound
  const playMessageSound = useCallback((options: SoundOptions = {}) => {
    const { volume = 0.3 } = options
    
    try {
      // Simple two-tone sound for messages
      const audioContext = initAudio()
      
      // First tone
      const oscillator1 = audioContext.createOscillator()
      const gain1 = audioContext.createGain()
      oscillator1.connect(gain1)
      gain1.connect(audioContext.destination)
      
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator1.type = 'sine'
      gain1.gain.setValueAtTime(0, audioContext.currentTime)
      gain1.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
      
      oscillator1.start(audioContext.currentTime)
      oscillator1.stop(audioContext.currentTime + 0.15)
      
      // Second tone (slightly higher)
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        oscillator2.connect(gain2)
        gain2.connect(audioContext.destination)
        
        oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator2.type = 'sine'
        gain2.gain.setValueAtTime(0, audioContext.currentTime)
        gain2.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.1)
      }, 100)
      
    } catch (error) {
      console.error('Error playing message sound:', error)
    }
  }, [initAudio])

  // Play DM notification sound
  const playDMSound = useCallback((options: SoundOptions = {}) => {
    const { volume = 0.4 } = options
    
    try {
      // Different sound for DMs (three-tone chime)
      const audioContext = initAudio()
      
      const frequencies = [600, 800, 1000]
      const delays = [0, 50, 100]
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gain = audioContext.createGain()
          oscillator.connect(gain)
          gain.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine'
          gain.gain.setValueAtTime(0, audioContext.currentTime)
          gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.2)
        }, delays[index])
      })
      
    } catch (error) {
      console.error('Error playing DM sound:', error)
    }
  }, [initAudio])

  // Play mention notification sound
  const playMentionSound = useCallback((options: SoundOptions = {}) => {
    const { volume = 0.5 } = options
    
    try {
      // More attention-grabbing sound for mentions
      const audioContext = initAudio()
      
      // Ascending tone sequence
      const frequencies = [400, 600, 800, 1000, 1200]
      const delays = [0, 80, 160, 240, 320]
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gain = audioContext.createGain()
          oscillator.connect(gain)
          gain.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'triangle' // Different wave type for mentions
          gain.gain.setValueAtTime(0, audioContext.currentTime)
          gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
        }, delays[index])
      })
      
    } catch (error) {
      console.error('Error playing mention sound:', error)
    }
  }, [initAudio])

  // Play channel notification sound
  const playChannelSound = useCallback((options: SoundOptions = {}) => {
    const { volume = 0.35 } = options
    
    try {
      // Channel-specific sound (bell-like)
      const audioContext = initAudio()
      
      // Bell-like sound with harmonics
      const baseFreq = 800
      const harmonics = [1, 1.5, 2, 2.5]
      
      harmonics.forEach((harmonic, index) => {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(baseFreq * harmonic, audioContext.currentTime)
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0, audioContext.currentTime)
        gain.gain.linearRampToValueAtTime(volume / (index + 1), audioContext.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      })
      
    } catch (error) {
      console.error('Error playing channel sound:', error)
    }
  }, [initAudio])

  // Test sound function
  const testSound = useCallback((type: 'message' | 'dm' | 'mention' | 'channel' = 'message') => {
    switch (type) {
      case 'message':
        playMessageSound()
        break
      case 'dm':
        playDMSound()
        break
      case 'mention':
        playMentionSound()
        break
      case 'channel':
        playChannelSound()
        break
    }
  }, [playMessageSound, playDMSound, playMentionSound, playChannelSound])

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  return {
    playMessageSound,
    playDMSound,
    playMentionSound,
    playChannelSound,
    testSound,
    stopAllSounds,
  }
}
