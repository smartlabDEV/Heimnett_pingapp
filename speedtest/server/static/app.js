/**
 * SpeedTest Server — Frontend JavaScript
 * Bruker Fetch API og performance.now() for presis tidsmåling.
 */

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  running: false,
  history: [],          // max 10 oppføringer
  selectedSize: {
    download: '10MB',
    upload:   '10MB',
  },
};

// ── DOM helpers ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function setGauge(value, unit, label, running = false) {
  $('speedValue').textContent = value;
  $('speedUnit').textContent  = unit;
  $('speedLabel').textContent = label;
  const gauge = $('gauge');
  if (running) gauge.classList.add('running');
  else         gauge.classList.remove('running');
}

function lockButtons(lock) {
  ['btnDownload', 'btnUpload', 'btnPing'].forEach(id => {
    $(id).disabled = lock;
  });
  state.running = lock;
}

// ── Server info ──────────────────────────────────────────────────────────
async function loadServerInfo() {
  try {
    const res  = await fetch('/speedtest/status');
    const data = await res.json();

    $('chipHostname').textContent = '🖥 ' + (data.hostname || 'unknown');
    $('chipIp').textContent       = '🌐 ' + (data.server_ip || 'unknown');
    $('chipVersion').textContent  = 'v' + (data.version || '1.0.0');

    // Update curl example with server IP
    const origin = window.location.origin;
    $('curlExample').textContent =
      `# Nedlasting\ncurl -o /dev/null -w "%{speed_download}" ${origin}/download?size=25MB\n\n# Ping\ncurl ${origin}/ping`;
  } catch (_) {
    // silently ignore — server info is cosmetic
  }
}

// ── Size selector ─────────────────────────────────────────────────────────
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.test;
    const size = btn.dataset.size;
    state.selectedSize[type] = size;
    document.querySelectorAll(`.size-btn[data-test="${type}"]`).forEach(b => {
      b.classList.toggle('active', b === btn);
    });
  });
});

// ── History table ─────────────────────────────────────────────────────────
function addHistory(type, size, result) {
  const now = new Date().toLocaleTimeString('no-NO');
  state.history.unshift({ time: now, type, size, result });
  if (state.history.length > 10) state.history.pop();
  renderHistory();
}

function renderHistory() {
  const tbody = $('historyBody');
  $('historyCount').textContent = `(${state.history.length})`;

  if (state.history.length === 0) {
    tbody.innerHTML = '<tr id="emptyRow"><td colspan="4" class="empty-row">Ingen tester kjørt ennå</td></tr>';
    return;
  }

  tbody.innerHTML = state.history.map(entry => {
    const badgeClass = `badge-${entry.type}`;
    const typeLabel  = entry.type === 'download' ? 'Nedlasting'
                     : entry.type === 'upload'   ? 'Opplasting'
                     : 'Ping';
    return `
      <tr>
        <td>${entry.time}</td>
        <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
        <td>${entry.size || '—'}</td>
        <td class="result-value">${entry.result}</td>
      </tr>`;
  }).join('');
}

// ── Download test ─────────────────────────────────────────────────────────
async function runDownload() {
  const size = state.selectedSize.download;
  setGauge('…', 'Mbit/s', `Laster ned ${size}`, true);

  const t0  = performance.now();
  const res = await fetch(`/download?size=${size}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Read full body to measure transfer time
  const reader = res.body.getReader();
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    const elapsed = (performance.now() - t0) / 1000;
    const mbps    = (bytes * 8) / elapsed / 1e6;
    setGauge(mbps.toFixed(1), 'Mbit/s', `Laster ned ${size}…`, true);
  }

  const elapsed = (performance.now() - t0) / 1000;
  const mbps    = (bytes * 8) / elapsed / 1e6;
  setGauge(mbps.toFixed(1), 'Mbit/s', '✅ Nedlasting ferdig', false);
  addHistory('download', size, `${mbps.toFixed(1)} Mbit/s`);
}

// ── Upload test ───────────────────────────────────────────────────────────
async function runUpload() {
  const size    = state.selectedSize.upload;
  const sizeMB  = parseInt(size, 10);
  const bytes   = sizeMB * 1024 * 1024;

  setGauge('…', 'Mbit/s', `Genererer ${size}…`, true);

  // Generate random payload
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer.subarray(0, Math.min(bytes, 65536)));
  // Fill rest with pattern (fast)
  for (let i = 65536; i < bytes; i++) buffer[i] = i & 0xff;

  setGauge('…', 'Mbit/s', `Laster opp ${size}`, true);

  const t0  = performance.now();
  const res = await fetch('/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
  const elapsed = (performance.now() - t0) / 1000;

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const mbps = (bytes * 8) / elapsed / 1e6;
  setGauge(mbps.toFixed(1), 'Mbit/s', '✅ Opplasting ferdig', false);
  addHistory('upload', size, `${mbps.toFixed(1)} Mbit/s`);
}

// ── Ping test ─────────────────────────────────────────────────────────────
async function runPing() {
  const COUNT   = 5;
  const latencies = [];

  for (let i = 0; i < COUNT; i++) {
    setGauge(`${i + 1}/${COUNT}`, 'ms', 'Pinger…', true);
    const t0  = performance.now();
    const res = await fetch('/ping', { cache: 'no-store' });
    const rtt = performance.now() - t0;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    latencies.push(rtt);
    await new Promise(r => setTimeout(r, 200));
  }

  const min = Math.min(...latencies).toFixed(1);
  const max = Math.max(...latencies).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);

  setGauge(avg, 'ms', `min ${min} · max ${max}`, false);
  addHistory('ping', null, `avg ${avg} ms  (min ${min} / max ${max})`);
}

// ── Entry point ───────────────────────────────────────────────────────────
async function startTest(type) {
  if (state.running) return;
  lockButtons(true);
  try {
    if (type === 'download') await runDownload();
    else if (type === 'upload') await runUpload();
    else if (type === 'ping')   await runPing();
  } catch (err) {
    setGauge('Feil', '', err.message, false);
    console.error(err);
  } finally {
    lockButtons(false);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
loadServerInfo();
