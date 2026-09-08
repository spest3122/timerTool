import { useState, useEffect, useRef } from "react";
import { useSettings } from "../../context/SettingsContext";
import {
  saveTake,
  loadAllTakes,
  deleteTake,
  clearAllTakes,
} from "./mirrorStorage";
import "./MirrorPage.css";

const SCRIPT_STORAGE_KEY = "timerTool_mirror_script";
const MAX_RECORDING_SECONDS = 300; // 5-minute safety cap

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function MirrorPage() {
  const { speak } = useSettings() || {};

  // Square 1: Camera state
  const [cameraState, setCameraState] = useState("idle"); // 'idle' | 'requesting' | 'active' | 'error'
  const [cameraError, setCameraError] = useState("");
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);

  // Square 2: Script state
  const [scriptText, setScriptText] = useState(
    () => localStorage.getItem(SCRIPT_STORAGE_KEY) || ""
  );

  // Square 3: Recording state
  const [recordingState, setRecordingState] = useState("idle"); // 'idle' | 'recording' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const elapsedRef = useRef(0);

  // Square 4: Replay library state
  const [takes, setTakes] = useState([]);
  const [selectedTake, setSelectedTake] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  // Load existing takes from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    loadAllTakes().then((loaded) => {
      if (isMounted && loaded) {
        setTakes(loaded);
        if (loaded.length > 0) {
          setSelectedTake(loaded[0]);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update active video URL when selected take changes
  useEffect(() => {
    if (selectedTake?.blob && typeof URL !== "undefined" && URL.createObjectURL) {
      const url = URL.createObjectURL(selectedTake.blob);
      setActiveVideoUrl(url);
      return () => {
        if (URL.revokeObjectURL) {
          URL.revokeObjectURL(url);
        }
      };
    } else {
      setActiveVideoUrl(null);
    }
  }, [selectedTake]);

  // Camera activation
  const enableCamera = async () => {
    setCameraState("requesting");
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera device not supported in this browser environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setCameraState("active");
    } catch (err) {
      setCameraError(err?.message || "Camera access blocked or unavailable.");
      setCameraState("error");
    }
  };

  // Attach stream to video element once mounted
  useEffect(() => {
    if (cameraState === "active" && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      try {
        const playPromise = videoRef.current.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } catch (e) {}
    }
  }, [cameraState, mediaStream]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [mediaStream]);

  // Script text update & persistence
  const handleScriptChange = (e) => {
    const text = e.target.value;
    setScriptText(text);
    localStorage.setItem(SCRIPT_STORAGE_KEY, text);
  };

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const charCount = scriptText.length;

  const handleListen = () => {
    if (speak && scriptText.trim()) {
      speak(scriptText.trim());
    }
  };

  // Recording actions
  const startRecording = () => {
    if (!mediaStream || typeof MediaRecorder === "undefined") return;

    recordedChunksRef.current = [];
    elapsedRef.current = 0;
    setElapsedSeconds(0);

    let options = {};
    if (typeof MediaRecorder.isTypeSupported === "function") {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        options = { mimeType: "video/webm;codecs=vp8,opus" };
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        options = { mimeType: "video/mp4" };
      }
    }

    try {
      const recorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const finalDuration = elapsedRef.current;
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        const newTake = await saveTake({ blob, duration: finalDuration });
        setTakes((prev) => [newTake, ...prev]);
        setSelectedTake(newTake);
      };

      recorder.start(250);
      setRecordingState("recording");

      timerIntervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);

        // 5-minute safety cap
        if (elapsedRef.current >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");

      timerIntervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);

        if (elapsedRef.current >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecordingState("idle");
  };

  // Take actions
  const handleDeleteTake = async (e, id) => {
    e.stopPropagation();
    await deleteTake(id);
    const updated = takes.filter((t) => t.id !== id);
    setTakes(updated);
    if (selectedTake?.id === id) {
      setSelectedTake(updated[0] || null);
    }
  };

  const handleDownloadTake = (e, take) => {
    e.stopPropagation();
    if (!take?.blob || typeof window === "undefined") return;
    const url = URL.createObjectURL(take.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mirror-take-${take.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to clear all recorded takes?")) {
      await clearAllTakes();
      setTakes([]);
      setSelectedTake(null);
    }
  };

  return (
    <div className="mirror-page" data-testid="mirror-page">
      <header className="mirror-header">
        <h1>Mirror Studio</h1>
        <p>Observe your articulation, rehearse your script, and review your practice takes.</p>
      </header>

      <div className="mirror-grid" data-testid="mirror-grid">
        {/* Square 1: Live Webcam Mirror */}
        <section
          className="mirror-quadrant mirror-quadrant-webcam"
          data-testid="quadrant-webcam"
          aria-label="Webcam Mirror"
        >
          <div className="quadrant-title">
            <span>1. Webcam Mirror</span>
            {cameraState === "active" && (
              <span className="webcam-live-badge">
                <span className="live-dot" /> Live Mirror
              </span>
            )}
          </div>
          <div className="quadrant-content" data-testid="webcam-content">
            {cameraState === "idle" && (
              <div className="webcam-standby">
                <p>Click to activate your webcam mirror and monitor speech articulation.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={enableCamera}
                  aria-label="Enable Camera"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {cameraState === "requesting" && (
              <div className="webcam-standby">
                <p>Requesting camera & microphone access...</p>
              </div>
            )}

            {cameraState === "active" && (
              <div className="webcam-active-wrapper">
                <video
                  ref={videoRef}
                  data-testid="mirror-video"
                  className="mirror-video-flipped"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}

            {cameraState === "error" && (
              <div className="webcam-error">
                <p>Camera access blocked or unavailable.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={enableCamera}
                  aria-label="Retry camera access"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Square 2: Script Textarea */}
        <section
          className="mirror-quadrant mirror-quadrant-script"
          data-testid="quadrant-script"
          aria-label="Rehearsal Script"
        >
          <div className="quadrant-title">
            <span>2. Rehearsal Script</span>
          </div>
          <div className="quadrant-content" data-testid="script-content">
            <textarea
              className="script-textarea"
              placeholder="Type or paste phrases to rehearse in front of the mirror..."
              value={scriptText}
              onChange={handleScriptChange}
              aria-label="Rehearsal Script Text"
            />
            <div className="script-footer">
              <div className="script-counts">
                <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                <span>{charCount} {charCount === 1 ? "character" : "characters"}</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleListen}
                disabled={!scriptText.trim()}
                aria-label="Listen to script pronunciation"
              >
                Listen
              </button>
            </div>
          </div>
        </section>

        {/* Square 3: Recording Controls */}
        <section
          className="mirror-quadrant mirror-quadrant-controls"
          data-testid="quadrant-controls"
          aria-label="Recording Console"
        >
          <div className="quadrant-title">
            <span>3. Recording Console</span>
          </div>
          <div className="quadrant-content" data-testid="controls-content">
            <div className="controls-container">
              <div className="recording-timer" aria-label="Recording timer">
                {formatTime(elapsedSeconds)}
              </div>

              <div className="recording-status">
                {recordingState === "idle" && (
                  <span className="recording-status-badge status-idle">Ready to record</span>
                )}
                {recordingState === "recording" && (
                  <span className="recording-status-badge status-recording">
                    <span className="pulse-dot" /> Recording Take
                  </span>
                )}
                {recordingState === "paused" && (
                  <span className="recording-status-badge status-paused">Paused</span>
                )}
              </div>

              <div className="controls-actions">
                {recordingState === "idle" && (
                  <button
                    type="button"
                    className="btn-record"
                    onClick={startRecording}
                    disabled={cameraState !== "active"}
                    aria-label="Record"
                  >
                    ● Record
                  </button>
                )}

                {recordingState === "recording" && (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={pauseRecording}
                      aria-label="Pause recording"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      className="btn-record"
                      onClick={stopRecording}
                      aria-label="Stop recording"
                    >
                      ■ Stop
                    </button>
                  </>
                )}

                {recordingState === "paused" && (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={resumeRecording}
                      aria-label="Resume recording"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      className="btn-record"
                      onClick={stopRecording}
                      aria-label="Stop recording"
                    >
                      ■ Stop
                    </button>
                  </>
                )}
              </div>

              {cameraState !== "active" && (
                <div className="controls-hint">Enable camera to start recording</div>
              )}
            </div>
          </div>
        </section>

        {/* Square 4: Replay Record List */}
        <section
          className="mirror-quadrant mirror-quadrant-replay"
          data-testid="quadrant-replay"
          aria-label="Replay Library"
        >
          <div className="quadrant-title">
            <span>4. Replay Library</span>
            {takes.length > 0 && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleClearAll}
                aria-label="Clear All Takes"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="quadrant-content" data-testid="replay-content">
            <div className="replay-container">
              {/* Active Video Player */}
              {selectedTake && activeVideoUrl ? (
                <div className="replay-player-wrapper">
                  <video
                    key={activeVideoUrl}
                    controls
                    src={activeVideoUrl}
                    className="replay-player"
                    data-testid="active-replay-video"
                  />
                </div>
              ) : null}

              {/* Takes History List */}
              {takes.length === 0 ? (
                <div className="replay-empty">
                  <p>No takes recorded yet. Record a take to review your pronunciation and mouth shape.</p>
                </div>
              ) : (
                <>
                  <div className="takes-header">
                    <span className="takes-count">{takes.length} {takes.length === 1 ? "Take" : "Takes"}</span>
                  </div>
                  <div className="takes-list">
                    {takes.map((take) => (
                      <div
                        key={take.id}
                        data-testid={`take-item-${take.id}`}
                        className={`take-item ${selectedTake?.id === take.id ? "active-take" : ""}`}
                        onClick={() => setSelectedTake(take)}
                      >
                        <div className="take-info">
                          <span className="take-time">
                            Take #{take.id} &bull; {new Date(take.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="take-duration">
                            Duration: {formatTime(take.duration)}
                          </span>
                        </div>
                        <div className="take-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={(e) => handleDownloadTake(e, take)}
                            aria-label={`Download Take ${take.id}`}
                          >
                            Download Take
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={(e) => handleDeleteTake(e, take.id)}
                            aria-label={`Delete Take ${take.id}`}
                          >
                            Delete Take
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
