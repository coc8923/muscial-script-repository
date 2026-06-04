'use strict';

// ─── State ───────────────────────────────────────────────────
let ideas = JSON.parse(localStorage.getItem('melodyNoteIdeas') || '[]');
let currentType = 'text';
let selectedMoods = [];
let selectedGenres = [];
let filterType = 'all';
let filterMoods = [];
let filterBpmMin = 40;
let filterBpmMax = 200;
let detailOpenId = null;

// Voice recorder state
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let recordedBlob = null;
let analyserNode = null;
let animFrameId = null;

// Melody / sequencer state
const SEQ_ROWS = ['C5','B4','A4','G4','F4','E4','D4','C4'];
const SEQ_STEPS = 16;
let seqData = SEQ_ROWS.map(() => Array(SEQ_STEPS).fill(false));
let seqPlaying = false;
let seqStep = 0;
let seqIntervalId = null;
let audioCtx = null;
let tapTimes = [];
let capturedBpm = 120;

// ─── Helpers ─────────────────────────────────────────────────
function saveIdeas() {
  localStorage.setItem('melodyNoteIdeas', JSON.stringify(ideas));
}

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function noteFreq(noteName) {
  const noteMap = { C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392, A4:440, B4:493.88,
                    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880 };
  return noteMap[noteName] || 440;
}

function playNote(freq, duration = 0.3) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return '방금 전';
  if (diffM < 60) return `${diffM}분 전`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function blobToBase64(blob) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ─── Render ──────────────────────────────────────────────────
function getFilteredIdeas() {
  return ideas.filter(idea => {
    if (filterType !== 'all' && idea.type !== filterType) return false;
    if (filterMoods.length > 0 && !filterMoods.some(m => idea.moods?.includes(m))) return false;
    if (idea.bpm) {
      const b = parseInt(idea.bpm);
      if (b < filterBpmMin || b > filterBpmMax) return false;
    }
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    if (q) {
      const haystack = `${idea.title} ${idea.text} ${idea.moods?.join(' ')} ${idea.genres?.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function typeIcon(type) {
  return { text: '📝', voice: '🎤', melody: '🎹' }[type] || '📝';
}

function renderIdeaCard(idea) {
  const card = document.createElement('div');
  card.className = `idea-card type-${idea.type}`;
  card.dataset.id = idea.id;

  let innerContent = '';

  if (idea.type === 'voice' && idea.audioData) {
    innerContent = `
      <div class="card-voice-bar">
        <button class="play-mini" data-audio="${idea.audioData}" onclick="event.stopPropagation(); playMiniAudio(this)">▶</button>
        <div class="mini-wave"></div>
      </div>`;
  } else if (idea.type === 'melody' && idea.seqData) {
    innerContent = `<div style="font-size:12px;color:var(--text3);margin-bottom:6px;">🎵 ${countActiveSteps(idea.seqData)}개 노트 · ${idea.bpm||120} BPM</div>`;
  } else if (idea.text) {
    innerContent = `<div class="card-preview">${escapeHtml(idea.text)}</div>`;
  }

  const tags = [
    ...(idea.moods || []).map(m => `<span class="tag mood">${moodLabel(m)}</span>`),
    ...(idea.genres || []).map(g => `<span class="tag genre">${g}</span>`),
    idea.bpm ? `<span class="tag bpm">${idea.bpm} BPM</span>` : ''
  ].join('');

  card.innerHTML = `
    <div class="card-header">
      <span class="card-type-icon">${typeIcon(idea.type)}</span>
      <span class="card-date">${formatDate(idea.createdAt)}</span>
    </div>
    <div class="card-title">${escapeHtml(idea.title || '제목 없음')}</div>
    ${innerContent}
    <div class="card-tags">${tags}</div>
  `;

  card.addEventListener('click', () => openDetail(idea.id));
  return card;
}

function countActiveSteps(seqData) {
  return seqData.flat().filter(Boolean).length;
}

function moodLabel(m) {
  const map = { happy:'😊 신나는', sad:'😢 슬픈', chill:'😌 잔잔한', energetic:'⚡ 에너지', dreamy:'✨ 몽환적', romantic:'💕 로맨틱' };
  return map[m] || m;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderGrid() {
  const grid = document.getElementById('ideasGrid');
  const empty = document.getElementById('emptyState');
  const filtered = getFilteredIdeas();
  grid.innerHTML = '';
  if (filtered.length === 0) {
    empty.classList.add('visible');
  } else {
    empty.classList.remove('visible');
    filtered.slice().reverse().forEach(idea => grid.appendChild(renderIdeaCard(idea)));
  }
  updateStats();
}

function updateStats() {
  document.getElementById('statTotal').textContent = ideas.length;
  const today = new Date().toDateString();
  document.getElementById('statToday').textContent = ideas.filter(i => new Date(i.createdAt).toDateString() === today).length;
  document.getElementById('statVoice').textContent = ideas.filter(i => i.type === 'voice').length;
}

// ─── Capture Modal ────────────────────────────────────────────
function openCaptureModal() {
  document.getElementById('captureModal').classList.add('open');
  resetCaptureModal();
}

function closeCaptureModal() {
  document.getElementById('captureModal').classList.remove('open');
  stopRecording();
  stopSequencer();
}

function resetCaptureModal() {
  currentType = 'text';
  selectedMoods = [];
  selectedGenres = [];
  recordedBlob = null;
  audioChunks = [];
  capturedBpm = 120;
  seqData = SEQ_ROWS.map(() => Array(SEQ_STEPS).fill(false));

  document.getElementById('ideaTitle').value = '';
  document.getElementById('ideaText').value = '';
  document.getElementById('recorderTimer').textContent = '00:00';
  document.getElementById('btnRecord').classList.remove('recording');
  document.getElementById('recordLabel').textContent = '녹음 시작';
  document.getElementById('btnPlayVoice').classList.add('hidden');
  document.getElementById('btnDiscardVoice').classList.add('hidden');
  document.getElementById('bpmInput').value = 120;

  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'text'));
  document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('selected'));

  showPanel('text');
  renderSequencer();
}

function showPanel(type) {
  ['text','voice','melody'].forEach(t => {
    document.getElementById(`panel${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle('hidden', t !== type);
  });
}

// Type selector
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentType = btn.dataset.type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showPanel(currentType);
    if (currentType === 'melody') renderSequencer();
  });
});

// Mood chips
document.querySelectorAll('.mood-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const m = chip.dataset.mood;
    chip.classList.toggle('selected');
    if (chip.classList.contains('selected')) {
      selectedMoods.push(m);
    } else {
      selectedMoods = selectedMoods.filter(x => x !== m);
    }
  });
});

// Genre chips
document.querySelectorAll('.genre-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const g = chip.dataset.genre;
    chip.classList.toggle('selected');
    if (chip.classList.contains('selected')) {
      selectedGenres.push(g);
    } else {
      selectedGenres = selectedGenres.filter(x => x !== g);
    }
  });
});

// ─── Save ─────────────────────────────────────────────────────
document.getElementById('btnSave').addEventListener('click', async () => {
  const title = document.getElementById('ideaTitle').value.trim();
  const text = document.getElementById('ideaText').value.trim();

  if (currentType === 'text' && !title && !text) {
    document.getElementById('ideaText').focus();
    return;
  }

  const idea = {
    id: Date.now().toString(),
    type: currentType,
    title: title || null,
    moods: [...selectedMoods],
    genres: [...selectedGenres],
    bpm: capturedBpm !== 120 || currentType === 'melody' ? capturedBpm : null,
    createdAt: new Date().toISOString(),
  };

  if (currentType === 'text') {
    if (!text && !title) return;
    idea.text = text;
  } else if (currentType === 'voice') {
    if (!recordedBlob) { alert('먼저 녹음해주세요'); return; }
    idea.audioData = await blobToBase64(recordedBlob);
    idea.duration = Math.round((Date.now() - recordingStartTime) / 1000);
    idea.text = text;
  } else if (currentType === 'melody') {
    idea.seqData = seqData.map(r => [...r]);
    idea.bpm = parseInt(document.getElementById('bpmInput').value) || 120;
    idea.text = text;
  }

  ideas.push(idea);
  saveIdeas();
  renderGrid();
  closeCaptureModal();
});

// ─── Voice Recorder ───────────────────────────────────────────
document.getElementById('btnRecord').addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = getAudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    source.connect(analyserNode);

    audioChunks = [];
    recordedBlob = null;
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(t => t.stop());
      document.getElementById('btnPlayVoice').classList.remove('hidden');
      document.getElementById('btnDiscardVoice').classList.remove('hidden');
      stopWaveformAnimation();
    };
    mediaRecorder.start();
    recordingStartTime = Date.now();

    const btn = document.getElementById('btnRecord');
    btn.classList.add('recording');
    document.getElementById('recordLabel').textContent = '녹음 중... (탭하여 중지)';

    recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2,'0');
      const s = String(elapsed % 60).padStart(2,'0');
      document.getElementById('recorderTimer').textContent = `${m}:${s}`;
    }, 500);

    drawWaveform();
  } catch (err) {
    alert('마이크 접근 권한이 필요합니다: ' + err.message);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    clearInterval(recordingTimer);
    const btn = document.getElementById('btnRecord');
    btn.classList.remove('recording');
    document.getElementById('recordLabel').textContent = '다시 녹음';
  }
}

function drawWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  const ctx2d = canvas.getContext('2d');
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyserNode.getByteTimeDomainData(dataArray);
    ctx2d.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg3') || '#1a1a2e';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = '#7c6cf8';
    ctx2d.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx2d.moveTo(x, y);
      else ctx2d.lineTo(x, y);
      x += sliceWidth;
    }
    ctx2d.lineTo(canvas.width, canvas.height / 2);
    ctx2d.stroke();
  }
  draw();
}

function stopWaveformAnimation() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  const canvas = document.getElementById('waveformCanvas');
  const ctx2d = canvas.getContext('2d');
  ctx2d.fillStyle = '#1a1a2e';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
}

document.getElementById('btnPlayVoice').addEventListener('click', () => {
  if (!recordedBlob) return;
  const url = URL.createObjectURL(recordedBlob);
  const audio = new Audio(url);
  audio.play();
});

document.getElementById('btnDiscardVoice').addEventListener('click', () => {
  recordedBlob = null;
  audioChunks = [];
  document.getElementById('btnPlayVoice').classList.add('hidden');
  document.getElementById('btnDiscardVoice').classList.add('hidden');
  document.getElementById('recorderTimer').textContent = '00:00';
  document.getElementById('recordLabel').textContent = '녹음 시작';
  stopWaveformAnimation();
});

// ─── Piano ────────────────────────────────────────────────────
function buildPiano() {
  const piano = document.getElementById('piano');
  piano.innerHTML = '';
  const keys = [
    { note:'C4', type:'white', label:'C4' }, { note:'C#4', type:'black' },
    { note:'D4', type:'white', label:'D4' }, { note:'D#4', type:'black' },
    { note:'E4', type:'white', label:'E4' },
    { note:'F4', type:'white', label:'F4' }, { note:'F#4', type:'black' },
    { note:'G4', type:'white', label:'G4' }, { note:'G#4', type:'black' },
    { note:'A4', type:'white', label:'A4' }, { note:'A#4', type:'black' },
    { note:'B4', type:'white', label:'B4' },
    { note:'C5', type:'white', label:'C5' }, { note:'C#5', type:'black' },
    { note:'D5', type:'white', label:'D5' }, { note:'D#5', type:'black' },
    { note:'E5', type:'white', label:'E5' },
    { note:'F5', type:'white', label:'F5' }, { note:'F#5', type:'black' },
    { note:'G5', type:'white', label:'G5' },
  ];

  const noteFreqMap = {
    'C4':261.63,'C#4':277.18,'D4':293.66,'D#4':311.13,'E4':329.63,
    'F4':349.23,'F#4':369.99,'G4':392,'G#4':415.3,'A4':440,'A#4':466.16,'B4':493.88,
    'C5':523.25,'C#5':554.37,'D5':587.33,'D#5':622.25,'E5':659.25,
    'F5':698.46,'F#5':739.99,'G5':783.99
  };

  keys.forEach(k => {
    const key = document.createElement('div');
    key.className = `piano-key ${k.type}`;
    if (k.label) {
      const lbl = document.createElement('div');
      lbl.className = 'piano-key-label';
      lbl.textContent = k.label;
      key.appendChild(lbl);
    }
    key.addEventListener('mousedown', () => {
      const freq = noteFreqMap[k.note];
      if (freq) playNote(freq, 0.5);
      key.classList.add('active');
    });
    key.addEventListener('mouseup', () => key.classList.remove('active'));
    key.addEventListener('mouseleave', () => key.classList.remove('active'));
    key.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const freq = noteFreqMap[k.note];
      if (freq) playNote(freq, 0.5);
      key.classList.add('active');
    }, { passive: false });
    key.addEventListener('touchend', () => key.classList.remove('active'));
    piano.appendChild(key);
  });
}

// ─── Sequencer ────────────────────────────────────────────────
function renderSequencer() {
  const seq = document.getElementById('sequencer');
  seq.innerHTML = '';
  SEQ_ROWS.forEach((note, row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'seq-row';
    const lbl = document.createElement('div');
    lbl.className = 'seq-label';
    lbl.textContent = note;
    rowEl.appendChild(lbl);
    for (let col = 0; col < SEQ_STEPS; col++) {
      const step = document.createElement('div');
      step.className = `seq-step${col % 4 === 0 ? ' beat4' : ''}${seqData[row][col] ? ' on' : ''}`;
      step.dataset.row = row;
      step.dataset.col = col;
      step.addEventListener('click', () => {
        seqData[row][col] = !seqData[row][col];
        step.classList.toggle('on', seqData[row][col]);
      });
      rowEl.appendChild(step);
    }
    seq.appendChild(rowEl);
  });
}

function startSequencer() {
  if (seqPlaying) return;
  seqPlaying = true;
  seqStep = 0;
  const bpm = parseInt(document.getElementById('bpmInput').value) || 120;
  const interval = (60 / bpm / 4) * 1000;

  seqIntervalId = setInterval(() => {
    document.querySelectorAll('.seq-step.current').forEach(el => el.classList.remove('current'));
    SEQ_ROWS.forEach((note, row) => {
      const stepEl = document.querySelector(`.seq-step[data-row="${row}"][data-col="${seqStep}"]`);
      if (stepEl) stepEl.classList.add('current');
      if (seqData[row][seqStep]) playNote(noteFreq(note), 0.15);
    });
    seqStep = (seqStep + 1) % SEQ_STEPS;
  }, interval);
}

function stopSequencer() {
  seqPlaying = false;
  clearInterval(seqIntervalId);
  document.querySelectorAll('.seq-step.current').forEach(el => el.classList.remove('current'));
  seqStep = 0;
}

document.getElementById('btnSeqPlay').addEventListener('click', startSequencer);
document.getElementById('btnSeqStop').addEventListener('click', stopSequencer);
document.getElementById('btnSeqClear').addEventListener('click', () => {
  stopSequencer();
  seqData = SEQ_ROWS.map(() => Array(SEQ_STEPS).fill(false));
  renderSequencer();
});

// ─── Tap Tempo ────────────────────────────────────────────────
document.getElementById('btnTap').addEventListener('click', () => {
  const now = Date.now();
  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift();
  if (tapTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i-1]);
    const avg = intervals.reduce((a,b) => a+b, 0) / intervals.length;
    capturedBpm = Math.round(60000 / avg);
    capturedBpm = Math.max(40, Math.min(250, capturedBpm));
    document.getElementById('bpmInput').value = capturedBpm;
  }
  setTimeout(() => { if (Date.now() - tapTimes[tapTimes.length-1] > 2500) tapTimes = []; }, 2500);
});

// ─── Detail Modal ─────────────────────────────────────────────
function openDetail(id) {
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;
  detailOpenId = id;

  document.getElementById('detailTitle').textContent = idea.title || '아이디어 상세';

  const content = document.getElementById('detailContent');
  let html = '<div class="detail-body">';

  if (idea.type === 'voice' && idea.audioData) {
    html += `<div class="detail-voice-player">
      <audio controls src="${idea.audioData}"></audio>
    </div>`;
  }

  if (idea.type === 'melody' && idea.seqData) {
    html += `<div class="detail-seq-preview" id="detailSeqGrid"></div>`;
  }

  if (idea.text) {
    html += `<div class="detail-text-content">${escapeHtml(idea.text)}</div>`;
  }

  const tags = [
    ...(idea.moods || []).map(m => `<span class="tag mood">${moodLabel(m)}</span>`),
    ...(idea.genres || []).map(g => `<span class="tag genre">${g}</span>`),
    idea.bpm ? `<span class="tag bpm">${idea.bpm} BPM</span>` : '',
    `<span class="tag">${typeIcon(idea.type)} ${({text:'텍스트',voice:'보이스',melody:'멜로디'})[idea.type]}</span>`
  ].join('');

  html += `<div class="detail-tags">${tags}</div>`;
  html += `<div class="detail-date">${new Date(idea.createdAt).toLocaleString('ko-KR')}</div>`;
  html += '</div>';

  content.innerHTML = html;

  if (idea.type === 'melody' && idea.seqData) {
    renderDetailSeq(idea.seqData, document.getElementById('detailSeqGrid'));
  }

  document.getElementById('detailModal').classList.add('open');
}

function renderDetailSeq(data, container) {
  container.innerHTML = '';
  data.forEach((row, ri) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'seq-row';
    const lbl = document.createElement('div');
    lbl.className = 'seq-label';
    lbl.textContent = SEQ_ROWS[ri];
    rowEl.appendChild(lbl);
    row.forEach((on, ci) => {
      const step = document.createElement('div');
      step.className = `seq-step${ci % 4 === 0 ? ' beat4' : ''}${on ? ' on' : ''}`;
      rowEl.appendChild(step);
    });
    container.appendChild(rowEl);
  });
}

document.getElementById('btnCloseDetail').addEventListener('click', () => {
  document.getElementById('detailModal').classList.remove('open');
  detailOpenId = null;
});

document.getElementById('btnDeleteIdea').addEventListener('click', () => {
  if (!detailOpenId) return;
  if (!confirm('이 아이디어를 삭제할까요?')) return;
  ideas = ideas.filter(i => i.id !== detailOpenId);
  saveIdeas();
  renderGrid();
  document.getElementById('detailModal').classList.remove('open');
  detailOpenId = null;
});

// Click outside to close
document.getElementById('captureModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCaptureModal();
});
document.getElementById('detailModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('open');
    detailOpenId = null;
  }
});

// ─── Mini Audio Playback ──────────────────────────────────────
window.playMiniAudio = function(btn) {
  const src = btn.dataset.audio;
  if (!src) return;
  const audio = new Audio(src);
  audio.play();
  btn.textContent = '⏸';
  audio.onended = () => { btn.textContent = '▶'; };
};

// ─── FAB & Header Controls ────────────────────────────────────
document.getElementById('fabBtn').addEventListener('click', openCaptureModal);
document.getElementById('btnEmptyCapture').addEventListener('click', openCaptureModal);
document.getElementById('btnCloseModal').addEventListener('click', closeCaptureModal);

document.getElementById('btnSearch').addEventListener('click', () => {
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('visible');
  if (bar.classList.contains('visible')) document.getElementById('searchInput').focus();
});
document.getElementById('btnCloseSearch').addEventListener('click', () => {
  document.getElementById('searchBar').classList.remove('visible');
  document.getElementById('searchInput').value = '';
  renderGrid();
});
document.getElementById('searchInput').addEventListener('input', renderGrid);

document.getElementById('btnFilter').addEventListener('click', () => {
  document.getElementById('filterPanel').classList.toggle('open');
});

// Filter chips
document.querySelectorAll('[data-filter-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    filterType = btn.dataset.filterType;
    document.querySelectorAll('[data-filter-type]').forEach(b => b.classList.toggle('active', b === btn));
    renderGrid();
  });
});
document.querySelectorAll('[data-filter-mood]').forEach(btn => {
  btn.addEventListener('click', () => {
    const m = btn.dataset.filterMood;
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) filterMoods.push(m);
    else filterMoods = filterMoods.filter(x => x !== m);
    renderGrid();
  });
});

const bpmMinEl = document.getElementById('bpmMin');
const bpmMaxEl = document.getElementById('bpmMax');
function updateBpmRange() {
  filterBpmMin = parseInt(bpmMinEl.value);
  filterBpmMax = parseInt(bpmMaxEl.value);
  document.getElementById('bpmRangeLabel').textContent = `${filterBpmMin} – ${filterBpmMax} BPM`;
  renderGrid();
}
bpmMinEl.addEventListener('input', updateBpmRange);
bpmMaxEl.addEventListener('input', updateBpmRange);

// ─── Init ─────────────────────────────────────────────────────
buildPiano();
renderGrid();

// Sample idea on first launch
if (ideas.length === 0) {
  ideas = [
    {
      id: '1',
      type: 'text',
      title: '첫 번째 아이디어 예시',
      text: '비오는 날 카페에서 들려오는 재즈 멜로디...\n\n"빗소리와 함께 흘러가는 그 멜로디가 내 귀에 속삭였어"\n\n후렴구 아이디어: Am - F - C - G 코드 진행',
      moods: ['chill', 'dreamy'],
      genres: ['jazz', 'indie'],
      bpm: 78,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      type: 'melody',
      title: '아침 루틴 비트',
      seqData: SEQ_ROWS.map((note, r) => Array(SEQ_STEPS).fill(false).map((_, c) => {
        if (r === 7) return c % 4 === 0;
        if (r === 5) return c === 2 || c === 10;
        if (r === 3) return c === 6 || c === 14;
        return false;
      })),
      moods: ['energetic'],
      genres: ['pop'],
      bpm: 128,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];
  saveIdeas();
  renderGrid();
}
