const synth = window.speechSynthesis;
const textInput = document.getElementById("text-input");
const voiceSelect = document.getElementById("voice-select");
const langSelect = document.getElementById("lang-select");
const speedSlider = document.getElementById("speed-slider");
const speedLabel = document.getElementById("speed-label");
const loopToggle = document.getElementById("loop-toggle");
const loopLabel = document.getElementById("loop-label");
// --- DRAG, DROP & COPY UTILITY FOR "↺" ---
const dragTrigger = document.getElementById("drag-trigger");

const btnSpeak = document.getElementById("btn-speak");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnStop = document.getElementById("btn-stop");
const btnListen = document.getElementById("btn-listen");

let allVoices = [];
let isLooping = false;

// Track processing states for the line-by-line queue
let textLines = [];
let currentLineIndex = 0;
let hasRepeatedCurrentLine = false; // Tracks the "repeat exactly once" state when loop is OFF

function populateVoiceList() {
  if (!synth) return;
  allVoices = synth.getVoices();
  voiceSelect.innerHTML = "";

  const selectedLangPrefix = langSelect.value;
  const filteredVoices = allVoices.filter((voice) =>
    voice.lang.startsWith(selectedLangPrefix),
  );

  if (filteredVoices.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No native voices found for language";
    voiceSelect.appendChild(option);
    return;
  }

  filteredVoices.forEach((voice) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.default) option.textContent += " -- DEFAULT";
    option.setAttribute("data-name", voice.name);
    voiceSelect.appendChild(option);
  });
}

if (synth) {
  populateVoiceList();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
  }
}

langSelect.addEventListener("change", () => {
  populateVoiceList();
});

speedSlider.addEventListener("input", (e) => {
  speedLabel.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
});

loopToggle.addEventListener("change", (e) => {
  isLooping = e.target.checked;
  loopLabel.textContent = isLooping ? "On 🔁" : "Off";
});

// Master function responsible for speaking the current line block in queue
function speakCurrentQueueLine() {
  // FIX: If we run out of lines, check if global loop toggle is ON to restart the text
  if (currentLineIndex >= textLines.length) {
    if (isLooping && textLines.length > 0) {
      currentLineIndex = 0;
      hasRepeatedCurrentLine = false;
    } else {
      return;
    }
  }

  const currentLine = textLines[currentLineIndex].trim();
  const nextLine = textLines[currentLineIndex + 1]?.trim();

  // Skip purely empty lines and move to the next index
  if (currentLine === "" || currentLine === "↺") {
    currentLineIndex++;
    speakCurrentQueueLine();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(currentLine);
  const selectedOption =
    voiceSelect.selectedOptions[0]?.getAttribute("data-name");
  const selectedVoice = allVoices.find(
    (voice) => voice.name === selectedOption,
  );

  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = parseFloat(speedSlider.value);

  // When the speech engine finishes reading the current line:
  utterance.onend = function () {
    // Check if the user hit Stop mid-speech
    if (!synth.speaking && textLines.length === 0) return;
    console.log(nextLine, 12893890);

    // SCENARIO: The next line contains the trigger symbol "↺"
    if (nextLine === "↺") {
      if (isLooping) {
        // If loop toggle is ON: Keep reading this exact line forever
        speakCurrentQueueLine();
      } else {
        // If loop toggle is OFF:
        if (!hasRepeatedCurrentLine) {
          // Repeat it exactly once
          hasRepeatedCurrentLine = true;
          speakCurrentQueueLine();
        } else {
          // Already repeated once, reset the flag and advance PAST the "↺" line
          hasRepeatedCurrentLine = false;
          currentLineIndex += 2;
          speakCurrentQueueLine();
        }
      }
    } else {
      // SCENARIO: Normal line flow (No "↺" ahead)
      currentLineIndex++;
      speakCurrentQueueLine();
    }
  };

  utterance.onerror = function (event) {
    console.error("Utterance error:", event.error);
  };

  synth.speak(utterance);
}

function speakText(textToSpeak) {
  if (!synth || textToSpeak.trim() === "") return;

  // Break raw text up into individual lines based on linebreaks
  textLines = textToSpeak.split(/\r?\n/);
  currentLineIndex = 0;
  hasRepeatedCurrentLine = false;

  speakCurrentQueueLine();
}

btnSpeak.addEventListener("click", () => {
  synth.cancel(); // Clear any ongoing browser speech cache
  speakText(textInput.value);
});

btnPause.addEventListener("click", () => {
  if (synth.speaking && !synth.paused) synth.pause();
});

btnResume.addEventListener("click", () => {
  if (synth.speaking && synth.paused) synth.resume();
});

btnStop.addEventListener("click", () => {
  textLines = []; // Clear queue pipeline
  currentLineIndex = 0;
  hasRepeatedCurrentLine = false;
  synth.cancel();
});

// --- SPEECH RECOGNITION (DICTATION) ---
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  let isListening = false;

  btnListen.addEventListener("click", () => {
    if (!isListening) {
      let fullLocale = "en-US";
      if (langSelect.value === "de") fullLocale = "de-DE";
      if (langSelect.value === "es") fullLocale = "es-ES";

      recognition.lang = fullLocale;
      recognition.start();
    } else {
      recognition.stop();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    btnListen.textContent = "🛑 Listening... Speak Now";
    btnListen.classList.add("listening");
  };

  recognition.onend = () => {
    isListening = false;
    btnListen.textContent = "🎙️ Start Listening (Microphone)";
    btnListen.classList.remove("listening");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (textInput.value.trim() === "") {
      textInput.value = transcript;
    } else {
      textInput.value += " " + transcript;
    }
  };

  recognition.onerror = (event) => {
    console.error(event.error);
    if (event.error === "not-allowed") {
      alert("Microphone access blocked. Please adjust browser settings.");
    }
  };
} else {
  btnListen.disabled = true;
  btnListen.textContent = "🎙️ Speech Recognition Not Supported";
}

// Initiate Drag
dragTrigger.addEventListener("dragstart", (e) => {
  e.dataTransfer.setData("text/plain", "↺");
  e.dataTransfer.effectAllowed = "copy";
});

// Drop Handling on Textarea
textInput.addEventListener("dragover", (e) => {
  e.preventDefault();
});

textInput.addEventListener("drop", (e) => {
  e.preventDefault();
  const data = e.dataTransfer.getData("text/plain");

  if (data === "↺") {
    const cursorPosition = textInput.selectionStart;
    const currentText = textInput.value;

    const textBefore = currentText.substring(0, cursorPosition);
    const textAfter = currentText.substring(cursorPosition);

    const injection =
      textBefore.endsWith("\n") || textBefore === "" ? "↺\n" : "\n↺\n";

    textInput.value = textBefore + injection + textAfter;
    textInput.focus();
  }
});

// Click Handling on Badge
dragTrigger.addEventListener("click", () => {
  const cursorPosition = textInput.selectionStart;
  const currentText = textInput.value;

  const textBefore = currentText.substring(0, cursorPosition);
  const textAfter = currentText.substring(cursorPosition);

  const injection =
    textBefore.endsWith("\n") || textBefore === "" ? "↺\n" : "\n↺\n";

  textInput.value = textBefore + injection + textAfter;
  textInput.focus();

  // Quick success visual feedback flash
  dragTrigger.style.borderColor = "#28a745";
  setTimeout(() => {
    dragTrigger.style.borderColor = "#007bff";
  }, 250);
});

// Click Handling for Clear Button
const clearBtn = document.getElementById("clear-btn");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    textInput.focus();
    
    // Quick success visual feedback flash
    clearBtn.style.borderColor = "#dc3545"; // Red for clear
    setTimeout(() => {
      clearBtn.style.borderColor = "#cbd5e1"; // Revert to original
    }, 250);
  });
}
