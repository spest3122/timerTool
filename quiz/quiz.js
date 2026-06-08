const STORAGE_KEY = "zeitangaben-quiz-progress-v1";
const RESPONSE_FAST_MS = 3500;
const RESPONSE_SLOW_MS = 8500;
const HIGH_LATENCY_MS = 7000;
const now = () => Date.now();

const germanHours = [
    "null",
    "eins",
    "zwei",
    "drei",
    "vier",
    "fünf",
    "sechs",
    "sieben",
    "acht",
    "neun",
    "zehn",
    "elf",
    "zwölf",
    "dreizehn",
    "vierzehn",
    "fünfzehn",
    "sechzehn",
    "siebzehn",
    "achtzehn",
    "neunzehn",
    "zwanzig",
    "einundzwanzig",
    "zweiundzwanzig",
    "dreiundzwanzig",
];
const germanMinutes = [
    "null",
    "eins",
    "zwei",
    "drei",
    "vier",
    "fünf",
    "sechs",
    "sieben",
    "acht",
    "neun",
    "zehn",
    "elf",
    "zwölf",
    "dreizehn",
    "vierzehn",
    "fünfzehn",
    "sechzehn",
    "siebzehn",
    "achtzehn",
    "neunzehn",
    "zwanzig",
    "einundzwanzig",
    "zweiundzwanzig",
    "dreiundzwanzig",
    "vierundzwanzig",
    "fünfundzwanzig",
    "sechsundzwanzig",
    "siebenundzwanzig",
    "achtundzwanzig",
    "neunundzwanzig",
    "dreißig",
    "einunddreißig",
    "zweiunddreißig",
    "dreiunddreißig",
    "vierunddreißig",
    "fünfunddreißig",
    "sechsunddreißig",
    "siebenunddreißig",
    "achtunddreißig",
    "neununddreißig",
    "vierzig",
    "einundvierzig",
    "zweiundvierzig",
    "dreiundvierzig",
    "vierundvierzig",
    "fünfundvierzig",
    "sechsundvierzig",
    "siebenundvierzig",
    "achtundvierzig",
    "neunundvierzig",
    "fünfzig",
    "einundfünfzig",
    "zweiundfünfzig",
    "dreiundfünfzig",
    "vierundfünfzig",
    "fünfundfünfzig",
    "sechsundfünfzig",
    "siebenundfünfzig",
    "achtundfünfzig",
    "neunundfünfzig",
];

const DOM = {
    answerForm: document.getElementById("answerForm"),
    answerInput: document.getElementById("answerInput"),
    digitalCue: document.getElementById("digitalCue"),
    difficultyBadge: document.getElementById("difficultyBadge"),
    questionId: document.getElementById("questionId"),
    feedbackPanel: document.getElementById("feedbackPanel"),
    accuracyMetric: document.getElementById("accuracyMetric"),
    rtMetric: document.getElementById("rtMetric"),
    mixMetric: document.getElementById("mixMetric"),
    mixBar: document.getElementById("mixBar"),
    itemQueue: document.getElementById("itemQueue"),
    reviewCount: document.getElementById("reviewCount"),
    resetProgress: document.getElementById("resetProgress"),
    ticks: document.getElementById("ticks"),
    hourHand: document.getElementById("hourHand"),
    minuteHand: document.getElementById("minuteHand"),
};

function hourWord12(hour) {
    return germanHours[hour % 12 || 12];
}
function nextHourWord(hour) {
    return germanHours[(hour % 12) + 1];
}
function formatDigital(hour, minute) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function formalHourWord(hour) {
    return hour === 1 ? "ein" : germanHours[hour];
}
function formal24(hour, minute) {
    return `${formalHourWord(hour)} Uhr${minute === 0 ? "" : " " + germanMinutes[minute]}`;
}

function colloquial(hour, minute) {
    if (minute === 0) return `${hour % 12 === 1 ? "ein" : hourWord12(hour)} Uhr`;
    if (minute === 15) return `viertel nach ${hourWord12(hour)}`;
    if (minute === 30) return `halb ${nextHourWord(hour)}`;
    if (minute === 45) return `viertel vor ${nextHourWord(hour)}`;
    if (minute === 25) return `fünf vor halb ${nextHourWord(hour)}`;
    if (minute === 35) return `fünf nach halb ${nextHourWord(hour)}`;
    if (minute === 20) return `zwanzig nach ${hourWord12(hour)}`;
    if (minute === 40) return `zwanzig vor ${nextHourWord(hour)}`;
    if (minute < 30) return `${germanMinutes[minute]} nach ${hourWord12(hour)}`;
    return `${germanMinutes[60 - minute]} vor ${nextHourWord(hour)}`;
}

function buildDataset() {
    const dataset = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute++) {
            const digital = formatDigital(hour, minute);
            dataset.push({
                id: `L-${digital}`,
                hour,
                minute,
                digital,
                difficulty: "low",
                expected: formal24(hour, minute),
                label: "Formal 24h",
            });
            dataset.push({
                id: `H-${digital}`,
                hour,
                minute,
                digital,
                difficulty: "high",
                expected: colloquial(hour, minute),
                label: "Colloquial",
            });
        }
    }
    return dataset;
}

const dataset = buildDataset();
let progress = loadProgress();
let session = { attempts: 0, correct: 0, totalRt: 0, recent: [] };
let currentQuestion = null;
let questionStartedAt = 0;

function defaultProgress() {
    return Object.fromEntries(
        dataset.map((item) => [
            item.id,
            {
                questionId: item.id,
                lastRetrievalTimestamp: 0,
                errorCount: 0,
                currentRepetitionInterval: 0,
                historicalAverageResponseTime: null,
                repetitions: 0,
            },
        ]),
    );
}
function loadProgress() {
    try {
        return {
            ...defaultProgress(),
            ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
        };
    } catch {
        return defaultProgress();
    }
}
function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
function normalize(text) {
    return text.trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}

function highDifficultyRatio() {
    if (session.recent.length < 4) return 0.5;
    const recentAccuracy = session.recent.filter((r) => r.correct).length / session.recent.length;
    const avgRt = session.recent.reduce((sum, r) => sum + r.rt, 0) / session.recent.length;
    if (recentAccuracy >= 0.9 && avgRt <= RESPONSE_FAST_MS) return 0.82;
    if (recentAccuracy >= 0.78 && avgRt <= RESPONSE_SLOW_MS) return 0.65;
    if (recentAccuracy < 0.6 || avgRt > RESPONSE_SLOW_MS) return 0.32;
    return 0.5;
}

function priorityWeight(item) {
    const p = progress[item.id];
    const elapsed = now() - p.lastRetrievalTimestamp;
    const dueRatio = p.currentRepetitionInterval === 0 ? 2 : elapsed / p.currentRepetitionInterval;
    const rtPenalty = p.historicalAverageResponseTime
        ? Math.min(2.5, p.historicalAverageResponseTime / HIGH_LATENCY_MS)
        : 1;
    return Math.max(0.2, dueRatio) + p.errorCount * 0.75 + rtPenalty;
}

function chooseNextQuestion() {
    const ratio = highDifficultyRatio();
    const targetDifficulty = Math.random() < ratio ? "high" : "low";
    const pool = dataset.filter((item) => item.difficulty === targetDifficulty);
    const weighted = pool.map((item) => ({ item, weight: priorityWeight(item) }));
    const total = weighted.reduce((sum, row) => sum + row.weight, 0);
    let pick = Math.random() * total;
    for (const row of weighted) {
        pick -= row.weight;
        if (pick <= 0) return row.item;
    }
    return weighted[Math.floor(Math.random() * weighted.length)].item;
}

function setClock(hour, minute) {
    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    const minuteAngle = minute * 6;
    setHandPosition(DOM.hourHand, hourAngle, 50);
    setHandPosition(DOM.minuteHand, minuteAngle, 78);
}

function setHandPosition(hand, angle, length) {
    const radians = ((angle - 90) * Math.PI) / 180;
    hand.setAttribute("x2", 120 + Math.cos(radians) * length);
    hand.setAttribute("y2", 120 + Math.sin(radians) * length);
}

function renderTicks() {
    DOM.ticks.innerHTML = "";
    for (let i = 1; i <= 60; i++) {
        const angle = ((i * 6 - 90) * Math.PI) / 180;
        const major = i % 5 === 0;
        const r1 = major ? 95 : 103;
        const r2 = 108;
        const x1 = 120 + Math.cos(angle) * r1,
            y1 = 120 + Math.sin(angle) * r1;
        const x2 = 120 + Math.cos(angle) * r2,
            y2 = 120 + Math.sin(angle) * r2;
        DOM.ticks.insertAdjacentHTML(
            "beforeend",
            `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="${major ? 3 : 1}" />`,
        );
        if (major) {
            const n = i / 5;
            const tx = 120 + Math.cos(angle) * 78,
                ty = 120 + Math.sin(angle) * 78 + 5;
            DOM.ticks.insertAdjacentHTML(
                "beforeend",
                `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">${n}</text>`,
            );
        }
    }
}

function renderQuestion() {
    currentQuestion = chooseNextQuestion();
    DOM.digitalCue.textContent = currentQuestion.digital;
    DOM.questionId.textContent = currentQuestion.id;
    const isHigh = currentQuestion.difficulty === "high";
    DOM.difficultyBadge.textContent = isHigh ? "High · Colloquial" : "Low · Formal 24h";
    DOM.difficultyBadge.className = `rounded-full border px-3 py-1 font-bold ${isHigh ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`;
    setClock(currentQuestion.hour, currentQuestion.minute);
    DOM.feedbackPanel.classList.add("hidden");
    DOM.answerInput.value = "";
    DOM.answerInput.focus();
    questionStartedAt = now();
    renderMetrics();
}

function tokenDiff(submitted, expected) {
    const submittedTokens = normalize(submitted).split(" ").filter(Boolean);
    const expectedTokens = normalize(expected).split(" ").filter(Boolean);
    const max = Math.max(submittedTokens.length, expectedTokens.length);
    const rows = [];
    for (let i = 0; i < max; i++) {
        const user = submittedTokens[i];
        const correct = expectedTokens[i];
        if (user === correct && correct)
            rows.push(`<span class="feedback-token token-ok">${correct}</span>`);
        else {
            if (user) rows.push(`<span class="feedback-token token-extra">${user}</span>`);
            if (correct) rows.push(`<span class="feedback-token token-missing">${correct}</span>`);
        }
    }
    return rows.join("");
}

function updateProgress(item, correct, rt) {
    const p = progress[item.id];
    p.lastRetrievalTimestamp = now();
    p.historicalAverageResponseTime =
        p.historicalAverageResponseTime === null
            ? rt
            : Math.round(p.historicalAverageResponseTime * 0.75 + rt * 0.25);
    if (correct) {
        p.repetitions += 1;
        p.errorCount = Math.max(0, p.errorCount - 1);
        const latencyFactor = rt <= RESPONSE_FAST_MS ? 3.2 : rt <= HIGH_LATENCY_MS ? 1.8 : 0.75;
        const base = p.currentRepetitionInterval || 45_000;
        p.currentRepetitionInterval = Math.round(Math.max(45_000, base * latencyFactor));
    } else {
        p.errorCount += 1;
        p.repetitions = 0;
        p.currentRepetitionInterval = 30_000;
    }
    saveProgress();
}

function showFeedback(submitted, correct, rt) {
    const expected = currentQuestion.expected;
    const correctClass = correct
        ? "border-emerald-300 bg-emerald-50"
        : "border-rose-300 bg-rose-50";
    DOM.feedbackPanel.className = `rounded-2xl border p-4 ${correctClass}`;
    DOM.feedbackPanel.innerHTML = `
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3"><p class="text-lg font-black text-slate-900">${correct ? "Correct!" : "Not yet."}</p><span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm text-slate-700">RT ${rt} ms</span></div>
                    <p class="text-sm text-slate-600">The correct answer is always shown immediately:</p>
                    <p class="text-2xl font-black text-slate-900">${expected}</p>
                    ${correct ? "" : `<div><p class="mb-2 text-sm font-bold text-slate-600">Differential feedback: red = your mismatched words, blue = the expected words.</p><div>${tokenDiff(submitted, expected)}</div></div>`}
                    <button id="nextQuestion" class="self-start rounded-xl bg-slate-900 px-4 py-2 font-black text-white hover:bg-slate-800">Next question</button>
                </div>`;
    document.getElementById("nextQuestion").addEventListener("click", renderQuestion);
}

function renderMetrics() {
    const ratio = Math.round(highDifficultyRatio() * 100);
    DOM.mixMetric.textContent = `${ratio}%`;
    DOM.mixBar.style.width = `${ratio}%`;
    DOM.accuracyMetric.textContent = session.attempts
        ? `${Math.round((session.correct / session.attempts) * 100)}%`
        : "0%";
    DOM.rtMetric.textContent = session.attempts
        ? `${Math.round(session.totalRt / session.attempts)} ms`
        : "-- ms";
    const due = dataset.filter((item) => priorityWeight(item) >= 1).length;
    DOM.reviewCount.textContent = `${due} due`;
    DOM.itemQueue.innerHTML = dataset
        .map((item) => ({ item, p: progress[item.id], w: priorityWeight(item) }))
        .sort((a, b) => b.w - a.w)
        .slice(0, 10)
        .map(
            ({ item, p, w }) =>
                `<div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div class="flex items-center justify-between"><span class="font-mono font-bold text-cyan-800">${item.id}</span><span class="text-xs ${item.difficulty === "high" ? "text-fuchsia-700" : "text-cyan-700"}">${item.label}</span></div><div class="mt-1 text-slate-700">${item.expected}</div><div class="mt-2 h-1.5 rounded-full bg-slate-100"><div class="h-full rounded-full bg-cyan-400" style="width:${Math.min(100, w * 18)}%"></div></div><div class="mt-1 text-xs text-slate-600">Errors: ${p.errorCount} · Avg RT: ${p.historicalAverageResponseTime ?? "--"} ms · Interval: ${Math.round(p.currentRepetitionInterval / 1000)} s</div></div>`,
        )
        .join("");
}

DOM.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentQuestion) return;
    const submitted = DOM.answerInput.value;
    const rt = now() - questionStartedAt;
    const correct = normalize(submitted) === normalize(currentQuestion.expected);
    session.attempts += 1;
    session.correct += correct ? 1 : 0;
    session.totalRt += rt;
    session.recent.push({ correct, rt });
    session.recent = session.recent.slice(-12);
    updateProgress(currentQuestion, correct, rt);
    showFeedback(submitted, correct, rt);
    renderMetrics();
});

DOM.resetProgress.addEventListener("click", () => {
    progress = defaultProgress();
    session = { attempts: 0, correct: 0, totalRt: 0, recent: [] };
    saveProgress();
    renderQuestion();
});

renderTicks();
renderQuestion();
