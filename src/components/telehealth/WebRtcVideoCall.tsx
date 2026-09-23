import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { api } from '../../api/client.js';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Maximize2, 
  Minimize2,
  Users,
  Send,
  AlertCircle
} from 'lucide-react';

interface WebRtcVideoCallProps {
  appointmentId: string;
  onEndCall: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const WebRtcVideoCall: React.FC<WebRtcVideoCallProps> = ({ appointmentId, onEndCall }) => {
  const { user } = useAuth();
  const { sendMessage, addListener } = useWebSocket();

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [peerVideoEnabled, setPeerVideoEnabled] = useState(true);
  const [peerAudioEnabled, setPeerAudioEnabled] = useState(true);

  const [callStatus, setCallStatus] = useState<'WAITING' | 'CONNECTED' | 'DISCONNECTED'>('WAITING');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Chat in call
  const [chatMessages, setChatMessages] = useState<Array<{ senderName: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  // Doctor Clinical Note Quick Draft in call
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Media references
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Load session info
  useEffect(() => {
    let mounted = true;
    api.get(`/consultations/room/${appointmentId}`)
      .then(data => {
        if (mounted) {
          setSessionData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setErrorMsg(err.message || 'Unable to join consultation room.');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [appointmentId]);

  // Setup Local Media & WebRTC
  useEffect(() => {
    if (!sessionData) return;
    const roomId = sessionData.session?.roomId || `room_${appointmentId}`;

    // Acquire Local Stream
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn('[WebRTC] Camera/Mic access denied or unavailable, using canvas preview:', e);
      }

      // Join Signaling Room
      sendMessage('JOIN_CONSULTATION_ROOM', { roomId }, roomId);
    }

    startMedia();

    // Setup WebRTC Peer Connection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('CONNECTED');
      }
    };

    // Handle local ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage('WEBRTC_ICE_CANDIDATE', { candidate: event.candidate }, roomId);
      }
    };

    // Add local tracks to PeerConnection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Signaling Listeners
    const removeJoined = addListener('PEER_JOINED', async () => {
      setCallStatus('CONNECTED');
      // If doctor or first to connect, create offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendMessage('WEBRTC_OFFER', { offer }, roomId);
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    });

    const removeOffer = addListener('WEBRTC_OFFER', async (payload: any) => {
      try {
        if (payload?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendMessage('WEBRTC_ANSWER', { answer }, roomId);
          setCallStatus('CONNECTED');
        }
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    const removeAnswer = addListener('WEBRTC_ANSWER', async (payload: any) => {
      try {
        if (payload?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setCallStatus('CONNECTED');
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    const removeCandidate = addListener('WEBRTC_ICE_CANDIDATE', async (payload: any) => {
      try {
        if (payload?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    const removePeerLeft = addListener('PEER_LEFT', () => {
      setCallStatus('WAITING');
    });

    const removeMediaToggle = addListener('PEER_MEDIA_TOGGLE', (payload: any) => {
      if (payload.videoEnabled !== undefined) setPeerVideoEnabled(payload.videoEnabled);
      if (payload.audioEnabled !== undefined) setPeerAudioEnabled(payload.audioEnabled);
    });

    return () => {
      removeJoined();
      removeOffer();
      removeAnswer();
      removeCandidate();
      removePeerLeft();
      removeMediaToggle();

      sendMessage('LEAVE_CONSULTATION_ROOM', {}, roomId);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      pc.close();
    };
  }, [sessionData, appointmentId, sendMessage, addListener]);

  // Consultation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        sendMessage('MEDIA_TOGGLE', { videoEnabled: videoTrack.enabled, audioEnabled }, sessionData?.session?.roomId);
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        sendMessage('MEDIA_TOGGLE', { videoEnabled, audioEnabled: audioTrack.enabled }, sessionData?.session?.roomId);
      }
    } else {
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleEndCall = async () => {
    try {
      await api.post('/consultations/end', {
        appointmentId,
        durationSeconds: secondsElapsed
      });
    } catch (e) {
      // ignore
    }
    onEndCall();
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      senderName: user?.fullName || 'Participant',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleSaveClinicalNote = async () => {
    if (!diagnosis.trim() || !clinicalNotes.trim()) return;
    try {
      await api.post('/medical-records', {
        patientId: sessionData.appointment.patientId,
        appointmentId,
        diagnosis,
        clinicalNotes
      });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 4000);
    } catch (e: any) {
      alert(e.message || 'Failed to save medical record.');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Initializing Secure Telehealth Room...</p>
        <p className="text-xs text-slate-400 mt-1">Authenticating encrypted WebRTC signaling channel</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h4 className="text-lg font-bold">Consultation Access Error</h4>
        <p className="text-sm text-slate-300 mt-1 max-w-md text-center">{errorMsg}</p>
        <button
          onClick={onEndCall}
          className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isDoctor = user?.role === 'DOCTOR';

  return (
    <div className="bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative">
      
      {/* Top Telehealth Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${callStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
              {callStatus === 'CONNECTED' ? 'Session In Progress' : 'Waiting for Remote Peer...'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebRTC Direct Transport</span>
          </div>
          <span className="text-xs font-medium text-slate-300">
            {isDoctor ? `Patient: ${sessionData.peer?.fullName}` : `Consulting: Dr. ${sessionData.peer?.fullName}`}
          </span>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="relative w-full h-[480px] sm:h-[540px] bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Remote Video / Participant Screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${callStatus === 'CONNECTED' ? 'block' : 'hidden'}`}
        />

        {/* Remote Waiting State Placeholder */}
        {callStatus !== 'CONNECTED' && (
          <div className="text-center p-8 max-w-md">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-cyan-500/40 flex items-center justify-center mx-auto mb-4 relative">
              <Users className="w-10 h-10 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h3 className="text-lg font-bold text-white">Waiting for {sessionData.peer?.fullName} to enter room</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The signaling server has notified the participant. Audio and video will synchronize automatically once they connect.
            </p>
          </div>
        )}

        {/* Local Video Picture-in-Picture (PiP) */}
        <div className="absolute bottom-4 right-4 w-36 sm:w-52 aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 z-20 group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${videoEnabled ? 'block' : 'hidden'}`}
          />
          {!videoEnabled && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
              <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
              <span>Camera Paused</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 bg-slate-950/80 px-1.5 py-0.5 rounded-sm text-[10px] text-white">
            You {audioEnabled ? '' : '(Muted)'}
          </div>
        </div>

        {/* In-Call Chat Drawer */}
        {chatOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">Consultation Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-xs text-slate-500 mt-8">No messages yet in this session.</p>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={i} className="text-xs bg-slate-800/80 p-2.5 rounded-lg">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-cyan-400">{m.senderName}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="text-slate-200">{m.text}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendChatMessage} className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a clinical note..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
              <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Doctor In-Call Medical Note Drawer */}
        {isDoctor && notesOpen && (
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-semibold uppercase tracking-wider text-slate-300">Clinical Record Entry</span>
              <button onClick={() => setNotesOpen(false)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Pharyngitis"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Clinical Observations</label>
                <textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="Patient reports sore throat, fever 101F, no cough..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              {noteSaved && (
                <p className="text-emerald-400 font-semibold text-center py-1">Record filed successfully!</p>
              )}
            </div>
            <button
              onClick={handleSaveClinicalNote}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
            >
              Save to Patient EHR
            </button>
          </div>
        )}

      </div>

      {/* Bottom Media Controls Bar */}
      <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
        
        {/* Secondary toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium ${
              chatOpen ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">In-Call Chat</span>
          </button>

          {isDoctor && (
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                notesOpen ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Clinical EHR</span>
            </button>
          )}
        </div>

        {/* Primary Audio / Video / Hang-up Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl border transition-all ${
              audioEnabled 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' 
                : 'bg-red-600/90 hover:bg-red-600 border-red-500 text-white'
            }`}
            title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl border transition-all ${
              videoEnabled 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' 
                : 'bg-red-600/90 hover:bg-red-600 border-red-500 text-white'
            }`}
            title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleEndCall}
            className="px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all text-sm"
            title="End Consultation"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>

        <div className="text-right text-[11px] text-slate-500 hidden sm:block">
          <span>Session: {sessionData.session?.roomId}</span>
        </div>

      </div>

    </div>
  );
};
