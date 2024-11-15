'use client'

import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';

export default function Speak() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  const buttonPressTimeout = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  };

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    try {
      // Speech to Text
      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionData = await transcriptionResponse.json();

      // Update conversation with user input
      setConversation((prev) => [...prev, { type: 'user', text: transcriptionData.text }]);

      // Generate Feedback
      const feedbackResponse = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcriptionData.text }),
      });

      if (!feedbackResponse.ok) {
        throw new Error('Failed to generate feedback');
      }

      const feedbackData = await feedbackResponse.json();

      // Update conversation with AI response
      setConversation((prev) => [...prev, { type: 'ai', text: feedbackData.feedback }]);

      // Text to Speech
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: feedbackData.feedback }),
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to convert feedback to speech');
      }

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio response
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.log('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonDown = () => {
    buttonPressTimeout.current = setTimeout(() => {
      setIsRecording(true);
    }, 500);
  };

  const handleButtonUp = () => {
    if (buttonPressTimeout.current) {
      clearTimeout(buttonPressTimeout.current);
    }
    if (isRecording) {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] aspect-[9/19] bg-white rounded-[40px] p-4 relative shadow-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-36 bg-black rounded-b-2xl"></div>

        <div className="h-full flex flex-col items-center justify-between py-8 sm:py-12">
          <p className="text-lg sm:text-xl font-medium text-neutral-800">Push to speak</p>

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <button
              onMouseDown={handleButtonDown}
              onMouseUp={handleButtonUp}
              onTouchStart={handleButtonDown}
              onTouchEnd={handleButtonUp}
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

          <div className="w-full max-w-[200px] sm:max-w-[240px] h-12 bg-neutral-100 rounded-full overflow-hidden flex items-center justify-center">
            {[...Array(20)].map((_, index) => (
              <div
                key={index}
                className="w-1 mx-0.5 bg-blue-500 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(4, audioLevel * 1000 * Math.random())}%`,
                }}
              ></div>
            ))}
          </div>

          <div className="w-full bg-neutral-100 p-4 rounded-lg overflow-y-auto max-h-48">
            {conversation.map((entry, index) => (
              <p
                key={index}
                className={`text-sm sm:text-base ${
                  entry.type === 'user' ? 'text-black' : 'text-blue-700'
                }`}
              >
                <strong>{entry.type === 'user' ? 'You: ' : 'AI: '}</strong>
                {entry.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
