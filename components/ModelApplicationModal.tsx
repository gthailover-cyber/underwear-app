
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, Check, ArrowRight, User } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ModelApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  language: Language;
}

type Step = 'intro' | 'camera-face' | 'review-face' | 'camera-body' | 'review-body' | 'success';

const ModelApplicationModal: React.FC<ModelApplicationModalProps> = ({ isOpen, onClose, onSubmit, language }) => {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<Step>('intro');
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize/Cleanup Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Front camera by default
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(t.cameraPermission);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen && (step === 'camera-face' || step === 'camera-body')) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => stopCamera();
  }, [isOpen, step]);

  const handleCaptureClick = () => {
    if (countdown !== null) return; // Prevent double click

    if (step === 'camera-body') {
      let count = 5;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          capturePhoto();
        }
      }, 1000);
    } else {
      capturePhoto();
    }
  };

  const capturePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Mirror effect if using front camera usually involves scale(-1, 1), 
                // but let's keep it simple for raw capture first.
                // To mirror: ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                if (step === 'camera-face') {
                    setFacePhoto(dataUrl);
                    setStep('review-face');
                } else if (step === 'camera-body') {
                    setBodyPhoto(dataUrl);
                    setStep('review-body');
                }
            }
        }
        setIsCapturing(false);
    }, 200); // Small delay for "shutter" feel
  };

  const handleRetake = () => {
    if (step === 'review-face') setStep('camera-face');
    if (step === 'review-body') setStep('camera-body');
  };

  const handleConfirmPhoto = () => {
    if (step === 'review-face') setStep('camera-body');
    if (step === 'review-body') handleSubmit();
  };

  const handleSubmit = () => {
    // Simulate submission
    onSubmit();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* --- STEP: INTRO --- */}
      {step === 'intro' && (
        <div className="flex-1 flex flex-col bg-gray-900 animate-fade-in">
           <div className="p-4 flex justify-end">
              <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-white"><X size={24} /></button>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50">
                 <User size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white uppercase">{t.modelAppTitle}</h2>
              <div className="text-gray-400 space-y-4 text-sm bg-gray-800 p-6 rounded-2xl border border-gray-700">
                 <h3 className="text-white font-bold text-lg mb-2">{t.instructions}</h3>
                 <p className="flex items-start gap-2"><span className="text-blue-500 font-bold">1.</span> {t.step1Desc}</p>
                 <p className="flex items-start gap-2"><span className="text-blue-500 font-bold">2.</span> {t.step2Desc}</p>
              </div>
              <button 
                onClick={() => setStep('camera-face')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
              >
                 <Camera size={20} /> {t.startCamera}
              </button>
           </div>
        </div>
      )}

      {/* --- STEP: CAMERA --- */}
      {(step === 'camera-face' || step === 'camera-body') && (
        <div className="flex-1 relative bg-black">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             className="w-full h-full object-cover transform scale-x-[-1]" // Mirror preview
           />
           
           {/* Overlays */}
           <div className="absolute inset-0 pointer-events-none">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                 <div>
                    <h3 className="text-white font-bold text-xl drop-shadow-md">
                       {step === 'camera-face' ? t.step1Title : t.step2Title}
                    </h3>
                    <p className="text-white/80 text-xs mt-1 drop-shadow-md max-w-[200px]">
                       {step === 'camera-face' ? t.step1Desc : t.step2Desc}
                    </p>
                 </div>
                 <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20">
                    {step === 'camera-face' ? '1/2' : '2/2'}
                 </div>
              </div>

              {/* Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                 {step === 'camera-face' ? (
                    <div className="w-64 h-80 border-2 border-blue-500/50 rounded-[50%] box-border shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                 ) : (
                    <div className="w-72 h-[60%] border-2 border-blue-500/50 rounded-3xl box-border shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative top-10"></div>
                 )}
              </div>

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-[2px]">
                    <span className="text-[120px] font-black text-white font-athletic drop-shadow-2xl animate-pulse">
                        {countdown}
                    </span>
                </div>
              )}
           </div>

           {/* Controls */}
           <div className="absolute bottom-0 left-0 right-0 pb-10 pt-20 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-8">
              <button onClick={onClose} disabled={countdown !== null} className="p-3 rounded-full bg-gray-800/50 text-white backdrop-blur border border-white/10 disabled:opacity-50">
                 <X size={24} />
              </button>
              <button 
                onClick={handleCaptureClick}
                disabled={countdown !== null}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative transition-transform ${countdown !== null ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
              >
                 <div className="w-16 h-16 bg-white rounded-full"></div>
              </button>
              <div className="w-12"></div> {/* Spacer for center alignment */}
           </div>
        </div>
      )}

      {/* --- STEP: REVIEW --- */}
      {(step === 'review-face' || step === 'review-body') && (
         <div className="flex-1 relative bg-black flex flex-col">
            <img 
              src={step === 'review-face' ? facePhoto! : bodyPhoto!} 
              className="flex-1 object-cover" 
              alt="Review" 
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md border-t border-gray-800">
               <div className="flex gap-4">
                  <button 
                    onClick={handleRetake}
                    className="flex-1 py-4 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                     <RefreshCw size={20} /> {t.retake}
                  </button>
                  <button 
                    onClick={handleConfirmPhoto}
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                     <Check size={20} /> {step === 'review-body' ? t.submitApp : t.usePhoto}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ModelApplicationModal;
