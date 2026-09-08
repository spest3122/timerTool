import { useState, useEffect, useRef } from "react";
import { useSettings } from "../../context/SettingsContext";
import "./MirrorPage.css";

const SCRIPT_STORAGE_KEY = "timerTool_mirror_script";

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
            <p>Audio and video recording controls</p>
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
          </div>
          <div className="quadrant-content" data-testid="replay-content">
            <p>Recorded takes and playback</p>
          </div>
        </section>
      </div>
    </div>
  );
}
