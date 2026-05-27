// ========== CONFIG ==========
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://mavjmwvyjssbhlhawzsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmptd3Z5anNzYmhsaGF3enNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzYyNDUsImV4cCI6MjA5NTQxMjI0NX0.ci3J54PLIt9NNPUR-GdIzPPDPv20om46G8TNPLdS7aw';

let sb = null;
try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {}

// ========== STATE ==========
let candidateName = '';
let candidatePhone = '';
let userAnswers = new Array(90).fill(-1);
let markedReview = new Array(90).fill(false);
let currentQ = 0;
let timeLeft = 90 * 60;
let timerInterval = null;
let qStartTime = Date.now();
let timePerQ = new Array(90).fill(0);

// ========== THEME ==========
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const icon = isDark ? '☾' : '☀';
  ['theme-icon','theme-icon2','theme-icon3','theme-icon4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
  localStorage.setItem('bioneet-theme', isDark ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem('bioneet-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = saved === 'light' ? '☾' : '☀';
  ['theme-icon','theme-icon2','theme-icon3','theme-icon4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
}

// ========== SCREEN ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

// ========== START TEST ==========
function startTest() {
  const n = document.getElementById('candidate-name').value.trim();
  if (!n) {
    alert('Please enter your name to start the test.');
    document.getElementById('candidate-name').focus();
    return;
  }
  candidateName = n;
  candidatePhone = document.getElementById('candidate-phone').value.trim();

  // Reset state
  userAnswers = new Array(90).fill(-1);
  markedReview = new Array(90).fill(false);
  timePerQ = new Array(90).fill(0);
  currentQ = 0;
  timeLeft = 90 * 60;

  document.getElementById('header-name').textContent = candidateName;
  showScreen('screen-test');
  buildPalette();
  loadQuestion(0);
  startTimer();
}

// ========== TIMER ==========
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const display = document.getElementById('timer-display');
  const wrap = document.getElementById('timer-wrap');
  if (display) display.textContent = `${m}:${String(s).padStart(2,'0')}`;
  if (wrap) {
    wrap.classList.toggle('danger', timeLeft <= 300);
  }
}

// ========== PALETTE ==========
function buildPalette() {
  const p = document.getElementById('palette');
  if (!p) return;
  p.innerHTML = '';
  for (let i = 0; i < 90; i++) {
    const b = document.createElement('button');
    b.className = 'pq';
    b.textContent = i + 1;
    b.id = 'pq' + i;
    b.setAttribute('aria-label', `Go to question ${i+1}`);
    b.onclick = () => gotoQ(i);
    p.appendChild(b);
  }
}

function updatePalette() {
  for (let i = 0; i < 90; i++) {
    const b = document.getElementById('pq' + i);
    if (!b) continue;
    b.className = 'pq';
    if (i === currentQ) b.classList.add('current');
    else if (markedReview[i]) b.classList.add('marked');
    else if (userAnswers[i] !== -1) b.classList.add('attempted');
  }
  const att = userAnswers.filter(a => a !== -1).length;
  const mrk = markedReview.filter(Boolean).length;
  const rem = 90 - att;
  const sa = document.getElementById('stat-att');
  const sm = document.getElementById('stat-mrk');
  const sr = document.getElementById('stat-rem');
  if (sa) sa.textContent = att;
  if (sm) sm.textContent = mrk;
  if (sr) sr.textContent = rem;
  const pf = document.getElementById('prog-fill');
  if (pf) pf.style.width = Math.round((att / 90) * 100) + '%';
}

// ========== LOAD QUESTION ==========
function loadQuestion(idx) {
  const q = QUESTIONS[idx];
  if (!q) return;

  const qn = document.getElementById('q-num');
  const qt = document.getElementById('q-topic');
  const qy = document.getElementById('q-year');
  const qtext = document.getElementById('q-text');
  const ol = document.getElementById('options-list');
  const bm = document.getElementById('btn-mark');

  if (qn) qn.textContent = idx + 1;
  if (qt) qt.textContent = q.topic;
  if (qy) {
    qy.textContent = q.year;
    qy.className = 'tag-year' + (q.year === 'Predicted' ? ' predicted' : '');
  }
  if (qtext) qtext.textContent = q.q;
  if (bm) bm.className = 'btn-mark' + (markedReview[idx] ? ' active' : '');

  if (ol) {
    ol.innerHTML = '';
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn' + (userAnswers[idx] === i ? ' selected' : '');
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65+i)}</span>${opt}`;
      btn.onclick = () => selectOption(i);
      ol.appendChild(btn);
    });
  }

  qStartTime = Date.now();
  updatePalette();
}

// ========== SELECT OPTION ==========
function selectOption(i) {
  saveTime();
  userAnswers[currentQ] = i;
  loadQuestion(currentQ);
}

// ========== MARK / CLEAR ==========
function toggleMark() {
  markedReview[currentQ] = !markedReview[currentQ];
  loadQuestion(currentQ);
}

function clearResponse() {
  userAnswers[currentQ] = -1;
  loadQuestion(currentQ);
}

// ========== NAVIGATION ==========
function nextQ() {
  saveTime();
  if (currentQ < 89) { currentQ++; loadQuestion(currentQ); }
}

function prevQ() {
  saveTime();
  if (currentQ > 0) { currentQ--; loadQuestion(currentQ); }
}

function gotoQ(idx) {
  saveTime();
  currentQ = idx;
  loadQuestion(idx);
}

function saveTime() {
  const elapsed = Math.floor((Date.now() - qStartTime) / 1000);
  timePerQ[currentQ] = (timePerQ[currentQ] || 0) + elapsed;
  qStartTime = Date.now();
}

// ========== SUBMIT ==========
function confirmSubmit() {
  const att = userAnswers.filter(a => a !== -1).length;
  const rem = 90 - att;
  if (rem > 0) {
    if (!confirm(`${rem} question${rem > 1 ? 's' : ''} unattempted.\n\nAre you sure you want to submit?`)) return;
  }
  clearInterval(timerInterval);
  submitTest();
}

function autoSubmit() {
  saveTime();
  submitTest();
}

function submitTest() {
  saveTime();
  const result = calculateResult();
  saveToSupabase(result);
  showScreen('screen-result');
  renderResult(result);
}

// ========== CALCULATE ==========
function calculateResult() {
  let correct = 0, wrong = 0, skipped = 0;
  const perQ = [];
  QUESTIONS.forEach((q, i) => {
    const ua = userAnswers[i];
    if (ua === -1) { skipped++; perQ.push('skip'); }
    else if (ua === q.ans) { correct++; perQ.push('correct'); }
    else { wrong++; perQ.push('wrong'); }
  });
  const score = correct * 4 - wrong;
  const maxScore = 360;
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const timeTaken = 90 * 60 - timeLeft;
  return { correct, wrong, skipped, score, maxScore, accuracy, timeTaken, perQ };
}

// ========== SUPABASE SAVE ==========
async function saveToSupabase(result) {
  if (!sb || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
  try {
    await sb.from('test_results').insert({
      candidate_name: candidateName,
      candidate_phone: candidatePhone,
      score: result.score,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      accuracy: result.accuracy,
      time_taken: result.timeTaken,
      answers: JSON.stringify(userAnswers),
      unit: 'Cell Unit',
      created_at: new Date().toISOString()
    });
  } catch(e) {
    console.log('Supabase save failed:', e.message);
  }
}

// ========== RENDER RESULT ==========
function renderResult(r) {
  const tm = Math.floor(r.timeTaken / 60);
  const ts = r.timeTaken % 60;
  const pct = Math.round((r.score / r.maxScore) * 100);
  const grade = pct >= 90 ? 'Excellent! 🏆' : pct >= 75 ? 'Very Good! 🎯' : pct >= 60 ? 'Good 👍' : pct >= 40 ? 'Average — Keep Going 💪' : 'Need More Practice 📚';

  let html = `
  <div class="result-hero">
    <div class="result-name">${candidateName} · Cell Unit · ${tm}m ${ts}s</div>
    <div class="result-score-big">${r.score}</div>
    <div class="result-max">out of ${r.maxScore}</div>
    <div class="result-grade">${grade}</div>
    <div class="result-stats">
      <div class="res-stat"><span class="res-stat-num green">${r.correct}</span><div class="res-stat-label">Correct</div></div>
      <div class="res-stat"><span class="res-stat-num red">${r.wrong}</span><div class="res-stat-label">Wrong</div></div>
      <div class="res-stat"><span class="res-stat-num amber">${r.skipped}</span><div class="res-stat-label">Skipped</div></div>
      <div class="res-stat"><span class="res-stat-num purple">${r.accuracy}%</span><div class="res-stat-label">Accuracy</div></div>
    </div>
  </div>
  <div class="result-actions">
    <button class="btn-result-action secondary" onclick="showScreen('screen-home')">← Home</button>
    <button class="btn-result-action secondary" onclick="showLeaderboard()">Leaderboard</button>
    <button class="btn-result-action primary" onclick="startTest()">Retry Test</button>
  </div>
  <div class="sol-section">
    <h3>Solutions & Explanations</h3>
  `;

  QUESTIONS.forEach((q, i) => {
    const ua = userAnswers[i];
    const status = r.perQ[i];
    const isCorrect = status === 'correct';
    const isSkip = status === 'skip';
    const tq = timePerQ[i] || 0;
    const cardClass = isCorrect ? 'correct-card' : isSkip ? 'skip-card' : 'wrong-card';
    const statusLabel = isCorrect ? '✓ Correct (+4)' : isSkip ? '— Skipped' : '✗ Wrong (−1)';
    const statusClass = isCorrect ? 'correct' : isSkip ? 'skip' : 'wrong';

    const optsHtml = q.opts.map((opt, oi) => {
      let cls = 'sol-opt';
      if (oi === q.ans) cls += ' correct';
      else if (!isSkip && ua === oi) cls += ' wrong';
      return `<div class="${cls}">${String.fromCharCode(65+oi)}. ${opt}</div>`;
    }).join('');

    html += `
    <div class="sol-card ${cardClass}">
      <div class="sol-top">
        <span class="sol-q-num">Q${i+1} | ${q.topic}</span>
        <div class="sol-tags">
          <span class="sol-status ${statusClass}">${statusLabel}</span>
        </div>
        <span class="sol-time">${tq}s spent</span>
      </div>
      <div class="sol-q-text">${q.q}</div>
      <div class="sol-opts">${optsHtml}</div>
      <div class="sol-explanation">
        <div class="sol-exp-label">Explanation</div>
        ${q.sol}
      </div>
    </div>`;
  });

  html += '</div>';
  const rb = document.getElementById('result-body');
  if (rb) rb.innerHTML = html;
}

// ========== LEADERBOARD ==========
async function showLeaderboard() {
  showScreen('screen-lb');
  const list = document.getElementById('lb-list');
  if (list) list.innerHTML = '<div class="lb-loading">Loading...</div>';

  if (!sb || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    if (list) list.innerHTML = '<div class="lb-loading">Connect Supabase to see leaderboard.</div>';
    return;
  }

  try {
    const { data, error } = await sb
      .from('test_results')
      .select('candidate_name, score, accuracy, time_taken, correct')
      .eq('unit', 'Cell Unit')
      .order('score', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      if (list) list.innerHTML = '<div class="lb-loading">No results yet. Be the first!</div>';
      return;
    }

    const ranks = ['🥇','🥈','🥉'];
    const rankClasses = ['gold','silver','bronze'];
    let html = '';
    data.forEach((row, i) => {
      const tm = Math.floor((row.time_taken || 0) / 60);
      const ts = (row.time_taken || 0) % 60;
      const rankLabel = i < 3 ? ranks[i] : (i + 1);
      const rankClass = i < 3 ? rankClasses[i] : '';
      html += `
      <div class="lb-row" style="animation-delay:${i*0.05}s">
        <div class="lb-rank ${rankClass}">${rankLabel}</div>
        <div class="lb-info">
          <div class="lb-name">${row.candidate_name}</div>
          <div class="lb-detail">${row.correct} correct · ${row.accuracy}% accuracy · ${tm}m ${ts}s</div>
        </div>
        <div class="lb-score">${row.score}</div>
      </div>`;
    });
    if (list) list.innerHTML = html;
  } catch(e) {
    if (list) list.innerHTML = '<div class="lb-loading">Error loading leaderboard.</div>';
  }
}

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', e => {
  const testActive = document.getElementById('screen-test').classList.contains('active');
  if (!testActive) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextQ();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevQ();
  if (['1','2','3','4'].includes(e.key)) selectOption(parseInt(e.key) - 1);
  if (e.key === 'm' || e.key === 'M') toggleMark();
  if (e.key === 'c' || e.key === 'C') clearResponse();
});

// ========== ENTER TO START ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const inp = document.getElementById('candidate-name');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') startTest(); });
});
