'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Loader2 } from 'lucide-react'

export default function Speak() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    if (isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.start()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
      }
    }
  }

  const processAudio = async (audioBlob) => {
    setIsProcessing(true)
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    try {
      // Step 1: Speech to Text
      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      })


      console.log(transcriptionResponse);
      

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const transcriptionData = await transcriptionResponse.json()

      // Step 2: Generate Feedback
      const feedbackResponse = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcriptionData.text }),
      })

      if (!feedbackResponse.ok) {
        throw new Error('Failed to generate feedback')
      }

      const feedbackData = await feedbackResponse.json()

      // Step 3: Text to Speech
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: feedbackData.feedback }),
      })

      if (!audioResponse.ok) {
        throw new Error('Failed to convert feedback to speech')
      }

      const audioBlob = await audioResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Play the audio response immediately
      const audio = new Audio(audioUrl)
      audio.play()

    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingClick = () => {
    setIsRecording(!isRecording)
  }

  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] aspect-[9/19] bg-white rounded-[40px] p-4 relative shadow-xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-36 bg-black rounded-b-2xl"></div>
        
        <div className="h-full flex flex-col items-center justify-between py-8 sm:py-12">
          <p className="text-lg sm:text-xl font-medium text-neutral-800">Push to speak</p>
          
          {/* Main Microphone Button */}
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <button
              onClick={handleRecordingClick}
              disabled={isProcessing}
              className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center shadow-lg transition-transform ${
                isRecording ? 'scale-95' : 'scale-100'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 animate-spin" />
              ) : (
                <Mic className={`w-10 h-10 sm:w-12 sm:h-12 ${isRecording ? 'text-blue-500' : 'text-neutral-600'}`} />
              )}
            </button>
            <p className="text-lg sm:text-xl font-medium text-neutral-800">
              {isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Push to speak'}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-[200px] sm:max-w-[240px] h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-blue-500 transition-all duration-300 ${
                isRecording ? 'w-3/4' : 'w-0'
              }`}
            ></div>
          </div>
          
          {/* Bottom Button */}
          <button
            onClick={handleRecordingClick}
            disabled={isProcessing}
            className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-white border border-neutral-200 shadow-md hover:shadow-lg transition-shadow ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-sm sm:text-base text-neutral-800 font-medium">
              {isRecording ? 'Stop' : 'Push to speak'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}