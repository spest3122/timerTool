import { useState, useEffect } from "react";
import "./MirrorPage.css";

export default function MirrorPage() {
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
          </div>
          <div className="quadrant-content" data-testid="webcam-content">
            <p>Live camera mirror feed</p>
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
            <p>Practice script notes</p>
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
