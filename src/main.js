import './style.css';

const DEFAULTS = {
  level: 62,
  capacity: 18,
  power: 4.5,
  profile: 'mobile',
};

const state = {
  level: DEFAULTS.level,
  capacity: DEFAULTS.capacity,
  power: DEFAULTS.power,
  profile: DEFAULTS.profile,
  charging: false,
  lowPowerMode: false,
  apiAvailable: false,
  source: 'manual',
  apiDischargingTime: null,
  chargingTime: null,
  remainingSeconds: 0,
  estimatedHours: 0,
  deadlineMs: null,
  lastUpdated: null,
  battery: null,
  timerId: null,
};

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand-lockup" aria-label="NERV Activity Limit">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <div>
          <p class="eyebrow">NERV // SYSTEM MONITOR</p>
          <h1>ACTIVITY LIMIT</h1>
        </div>
      </div>
      <div class="top-status" aria-label="システム接続状態">
        <span class="signal-dot" aria-hidden="true"></span>
        <span>LOCAL DEVICE LINK</span>
        <span class="top-clock" id="top-clock">--:--:--</span>
      </div>
    </header>

    <section class="alert-strip" aria-label="警告レベル">
      <div class="alert-copy">
        <span class="alert-icon" aria-hidden="true">!</span>
        <div>
          <span class="eyebrow">EMERGENCY STATUS</span>
          <strong id="alert-title">STANDBY / CALCULATING</strong>
        </div>
      </div>
      <div class="alert-right">
        <span class="power-source-chip" id="power-source-chip">内部電力 / INTERNAL</span>
        <span class="alert-detail" id="alert-detail">端末状態の同期を待機中</span>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="hero-panel panel-grid" aria-labelledby="limit-heading">
        <div class="panel-heading">
          <div>
            <span class="section-index">01</span>
            <span class="eyebrow">PREDICTED SHUTDOWN WINDOW</span>
          </div>
          <span class="live-tag"><span class="live-dot"></span>LIVE</span>
        </div>

        <div class="reference-board" aria-live="polite" aria-atomic="true">
          <div class="board-topline">
            <span>活動限界まで</span>
            <span>ACTIVE TIME REMAINING</span>
            <button class="low-power-toggle" id="low-power-toggle" type="button" aria-pressed="false">LOW POWER <strong id="low-power-state">OFF</strong></button>
          </div>
          <div class="board-main">
            <div class="board-digits">
              <p class="board-kicker">予想活動限界時間 / SHUTDOWN WINDOW</p>
              <div id="limit-heading" class="segment-display" role="img" aria-label="予想活動限界時間"><span id="activity-time-value" class="segment-readout">00:00:00.00</span></div>
              <div class="countdown-meta"><span id="countdown-status">放電換算 / INTERNAL POWER</span><span id="countdown-source">ESTIMATED</span></div>
              <div class="countdown" id="countdown">00:00:00</div>
              <div class="countdown-bar" aria-hidden="true"><span id="countdown-progress"></span></div>
            </div>
            <div class="board-side">
              <div class="supply-card supply-internal" id="supply-internal">
                <span>内部</span><strong>INTERNAL</strong><i class="hazard-mark" aria-hidden="true"></i>
              </div>
              <div class="supply-card supply-system">
                <span>主電源供給システム</span><strong>MAIN ENERGY<br />SUPPLY SYSTEM</strong>
              </div>
              <div class="supply-card supply-external" id="supply-external">
                <span>外部</span><strong>EXTERNAL</strong><i class="hazard-mark" aria-hidden="true"></i>
              </div>
            </div>
          </div>
          <div class="board-bottom">
            <div class="speed-strip" aria-label="活動モード表示">
              <span data-speed="stop" title="外部電力で充電中">STOP</span>
              <span data-speed="slow" title="省電力モード">SLOW</span>
              <span data-speed="normal" title="通常運転">NORMAL</span>
              <span data-speed="racing" title="高負荷状態">RACING</span>
            </div>
            <div class="danger-box">DANGER<br /><small>EMERGENCY</small></div>
          </div>
          <p class="board-caption">現在の消費電力が継続すると仮定した場合 / APPROXIMATE OUTPUT</p>
        </div>
      </section>

      <aside class="telemetry-panel panel-grid" aria-labelledby="telemetry-heading">
        <div class="panel-heading">
          <div>
            <span class="section-index">02</span>
            <span class="eyebrow">LIVE TELEMETRY</span>
          </div>
          <span class="panel-code">NERV-ATC-07</span>
        </div>
        <h2 id="telemetry-heading" class="sr-only">端末テレメトリ</h2>

        <div class="battery-readout">
          <div class="battery-ring" id="battery-ring" role="img" aria-label="バッテリー残量 0パーセント">
            <div class="ring-inner"><strong id="level-value">0</strong><span>%</span></div>
          </div>
          <div class="battery-meta">
            <span class="eyebrow">BATTERY LEVEL</span>
            <strong id="charging-value">状態確認中</strong>
            <span class="muted" id="source-value">データ取得元: 手動入力</span>
          </div>
        </div>

        <dl class="metrics-list">
          <div><dt>充電状態</dt><dd id="charging-detail">—</dd></div>
          <div><dt>消費電力</dt><dd id="power-detail">—</dd></div>
          <div><dt>充電完了まで</dt><dd id="charge-time-detail">—</dd></div>
          <div><dt>更新時刻</dt><dd id="updated-detail">—</dd></div>
        </dl>

        <div class="confidence-block">
          <div class="confidence-heading"><span>推定精度の目安</span><strong id="confidence-label">—</strong></div>
          <div class="confidence-track"><span id="confidence-bar"></span></div>
          <p id="confidence-note">端末から取得できるデータ量に応じて変化します。</p>
        </div>
      </aside>
    </div>

    <section class="input-panel panel-grid" aria-labelledby="input-heading">
      <div class="panel-heading">
        <div>
          <span class="section-index">03</span>
          <span class="eyebrow">MANUAL OVERRIDE / FALLBACK</span>
        </div>
        <span class="manual-status" id="manual-status">手動入力モード</span>
      </div>
      <div class="input-intro">
        <div>
          <h2 id="input-heading">端末プロファイルを調整</h2>
          <p>Battery Status APIが非対応の場合や、消費電力を現実に合わせて補正したい場合に使用します。</p>
        </div>
        <button class="ghost-button" type="button" id="sync-button">再同期 <span aria-hidden="true">↗</span></button>
      </div>
      <form class="manual-form" id="manual-form">
        <label>
          <span>端末タイプ</span>
          <select id="profile-input" name="profile">
            <option value="mobile">スマートフォン</option>
            <option value="tablet">タブレット</option>
            <option value="laptop">ノートPC</option>
            <option value="custom">カスタム</option>
          </select>
        </label>
        <label>
          <span>電力モード</span>
          <select id="power-mode-input" name="powerMode">
            <option value="internal">内部電力 / INTERNAL</option>
            <option value="external">外部電力 / EXTERNAL</option>
          </select>
        </label>
        <label>
          <span>現在の残量 <em>%</em></span>
          <input id="level-input" name="level" type="number" min="0" max="100" step="1" value="62" inputmode="decimal" />
        </label>
        <label>
          <span>満充電容量 <em>Wh</em></span>
          <input id="capacity-input" name="capacity" type="number" min="1" max="500" step="0.1" value="58" inputmode="decimal" />
        </label>
        <label>
          <span>消費電力 <em>W</em></span>
          <input id="power-input" name="power" type="number" min="0.1" max="500" step="0.1" value="8.5" inputmode="decimal" />
        </label>
      </form>
    </section>

    <section class="notice-panel" aria-label="注意事項">
      <span class="notice-line" aria-hidden="true"></span>
      <div>
        <strong>MISSION NOTE / 近似値に関する注意</strong>
        <p>この表示は、取得できたバッテリーデータと入力した消費電力から算出した近似値です。実際の活動限界は、画面の明るさ、通信、アプリの処理、温度、バッテリーの劣化などによって変動します。重要な作業は余裕をもって保存してください。</p>
      </div>
    </section>

    <footer class="footer">
      <span>NERV OPERATIONAL TECHNOLOGY DIVISION / UNOFFICIAL CONCEPT UI</span>
      <span id="api-footnote">BATTERY API: CHECKING</span>
    </footer>
    <div class="sr-only" id="status-announcer" role="status" aria-live="polite"></div>
  </main>
`;

const refs = {
  topClock: document.querySelector('#top-clock'),
  alertTitle: document.querySelector('#alert-title'),
  alertDetail: document.querySelector('#alert-detail'),
  powerSourceChip: document.querySelector('#power-source-chip'),
  speedItems: document.querySelectorAll('[data-speed]'),
  activityTime: document.querySelector('#activity-time-value'),
  countdown: document.querySelector('#countdown'),
  countdownStatus: document.querySelector('#countdown-status'),
  countdownSource: document.querySelector('#countdown-source'),
  countdownProgress: document.querySelector('#countdown-progress'),
  level: document.querySelector('#level-value'),
  ring: document.querySelector('#battery-ring'),
  chargingValue: document.querySelector('#charging-value'),
  source: document.querySelector('#source-value'),
  chargingDetail: document.querySelector('#charging-detail'),
  powerDetail: document.querySelector('#power-detail'),
  chargeTimeDetail: document.querySelector('#charge-time-detail'),
  updated: document.querySelector('#updated-detail'),
  confidenceLabel: document.querySelector('#confidence-label'),
  confidenceBar: document.querySelector('#confidence-bar'),
  confidenceNote: document.querySelector('#confidence-note'),
  manualStatus: document.querySelector('#manual-status'),
  apiFootnote: document.querySelector('#api-footnote'),
  statusAnnouncer: document.querySelector('#status-announcer'),
  form: document.querySelector('#manual-form'),
  profile: document.querySelector('#profile-input'),
  powerMode: document.querySelector('#power-mode-input'),
  levelInput: document.querySelector('#level-input'),
  capacityInput: document.querySelector('#capacity-input'),
  powerInput: document.querySelector('#power-input'),
  sync: document.querySelector('#sync-button'),
  lowPowerToggle: document.querySelector('#low-power-toggle'),
  lowPowerState: document.querySelector('#low-power-state'),
  supplyInternal: document.querySelector('#supply-internal'),
  supplyExternal: document.querySelector('#supply-external'),
};

const profiles = {
  mobile: { capacity: 18, power: 4.5 },
  tablet: { capacity: 32, power: 7 },
  laptop: { capacity: 58, power: 12 },
  custom: { capacity: 58, power: 8.5 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((item) => String(item).padStart(2, '0')).join(':');
}

function formatActivityTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const hundredths = Math.floor((safe - Math.floor(safe)) * 100);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

const SEGMENT_MAP = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg',
  '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
};

function updateSegmentDisplay(target, value) {
  const text = String(value);
  const structure = text.split('.').join('');
  const structureKey = [...structure].map((char) => char >= '0' && char <= '9' ? '0' : char).join('');
  if (!target.dataset.segmentReady || target.dataset.segmentStructure !== structureKey) {
    target.innerHTML = structure.split('').map((char) => {
      if (char === ':') return '<span class="segment-colon" aria-hidden="true"><i></i><i></i></span>';
      return `<span class="segment-digit" aria-hidden="true">${'abcdefgdp'.split('').map((name) => `<i class="segment seg-${name}" data-segment="${name}"></i>`).join('')}</span>`;
    }).join('');
    target.dataset.segmentReady = 'true';
    target.dataset.segmentStructure = structureKey;
  }

  const digitCharacters = [...text].filter((char) => char >= '0' && char <= '9');
  const dotPosition = text.indexOf('.');
  const decimalAfter = dotPosition < 0
    ? -1
    : [...text.slice(0, dotPosition)].filter((char) => char >= '0' && char <= '9').length - 1;
  const digits = [...target.querySelectorAll('.segment-digit')];
  digits.forEach((digit, index) => {
    const lit = SEGMENT_MAP[digitCharacters[index]] || '';
    digit.querySelectorAll('.segment').forEach((segment) => {
      const name = segment.dataset.segment;
      segment.classList.toggle('is-lit', name === 'dp' ? index === decimalAfter : lit.includes(name));
    });
    digit.dataset.value = digitCharacters[index] || '';
  });
  target.setAttribute('aria-label', `予想活動限界時間 ${text}`);
}

function formatDuration(seconds) {
  if (!finitePositive(seconds)) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}分`;
  return `${hours}時間 ${minutes}分`;
}

function nowLabel() {
  return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}

function setAnnouncer(message) {
  refs.statusAnnouncer.textContent = message;
}

function calculateManualSeconds() {
  const energy = state.capacity * (state.level / 100);
  return Math.max(1, (energy / Math.max(state.power, 0.1)) * 3600);
}

function calculate() {
  const apiTime = state.apiDischargingTime;
  const hasApiTime = state.source === 'battery-api' && !state.charging && finitePositive(apiTime);
  const seconds = hasApiTime ? apiTime : calculateManualSeconds();
  state.remainingSeconds = seconds;
  state.initialSeconds = seconds;
  state.estimatedHours = seconds / 3600;
  state.deadlineMs = Date.now() + (seconds * 1000);
  state.lastUpdated = Date.now();
  render();
}

function deriveConfidence() {
  if (state.source === 'battery-api' && finitePositive(state.apiDischargingTime)) return { label: 'HIGH', value: 88, note: '端末の放電残り時間を使用しています。' };
  if (state.source === 'battery-api') return { label: 'MEDIUM', value: 64, note: '残量は自動取得、消費電力はプロファイルから推定しています。' };
  return { label: 'GUIDE', value: 38, note: '入力された容量と消費電力から算出した目安です。' };
}

function getAlertLevel() {
  if (state.remainingSeconds <= 15 * 60 || state.level <= 10) return { title: 'CRITICAL / ACTIVITY LIMIT IMMINENT', detail: '残り時間が危険域に入りました', className: 'critical' };
  if (state.remainingSeconds <= 60 * 60 || state.level <= 25) return { title: 'WARNING / RESERVE POWER LOW', detail: '活動限界までの余裕が少なくなっています', className: 'warning' };
  return { title: 'STANDBY / ACTIVITY WITHIN LIMIT', detail: '端末は通常監視下にあります', className: 'normal' };
}

function getSpeedMode() {
  if (state.charging) return 'stop';
  if (state.lowPowerMode) return 'slow';
  return 'normal';
}

function render() {
  const level = clamp(state.level, 0, 100);
  const alert = getAlertLevel();
  const confidence = deriveConfidence();
  const speedMode = getSpeedMode();
  const powerMode = state.charging ? 'external' : 'internal';
  const ringColor = level <= 15 ? '#ff3f3f' : level <= 35 ? '#f7b955' : '#ff5b55';

  updateSegmentDisplay(refs.activityTime, formatActivityTime(state.remainingSeconds));
  refs.countdown.textContent = formatActivityTime(state.remainingSeconds);
  refs.countdownStatus.textContent = state.charging ? '外部電力 / EXTERNAL POWER' : state.lowPowerMode ? '低電力モード / LOW POWER' : '内部電力 / INTERNAL POWER';
  refs.countdownSource.textContent = state.source === 'battery-api' ? 'BATTERY API' : 'MANUAL ESTIMATE';
  refs.powerSourceChip.textContent = state.charging ? '外部電力 / EXTERNAL' : '内部電力 / INTERNAL';
  refs.level.textContent = Math.round(level);
  refs.ring.setAttribute('aria-label', `バッテリー残量 ${Math.round(level)}パーセント`);
  refs.ring.style.setProperty('--level', `${level * 3.6}deg`);
  refs.ring.style.setProperty('--ring-color', ringColor);
  refs.chargingValue.textContent = state.charging ? 'CHARGING / 充電中' : 'DISCHARGING / 放電中';
  refs.source.textContent = `データ取得元: ${state.source === 'battery-api' ? 'Battery Status API' : '手動入力'}`;
  refs.chargingDetail.textContent = state.charging ? '充電中' : '放電中';
  refs.powerDetail.textContent = `${state.power.toFixed(1)} W（推定）`;
  refs.chargeTimeDetail.textContent = finitePositive(state.chargingTime) ? formatDuration(state.chargingTime) : state.charging ? '取得不可' : '—';
  refs.updated.textContent = state.lastUpdated ? nowLabel() : '—';
  refs.confidenceLabel.textContent = confidence.label;
  refs.confidenceBar.style.width = `${confidence.value}%`;
  refs.confidenceNote.textContent = confidence.note;
  refs.alertTitle.textContent = alert.title;
  refs.alertDetail.textContent = alert.detail;
  refs.manualStatus.textContent = state.source === 'battery-api' ? '自動同期中 / 手動補正可' : '手動入力モード';
  refs.apiFootnote.textContent = state.apiAvailable ? 'BATTERY API: CONNECTED' : 'BATTERY API: FALLBACK';
  refs.countdownProgress.style.width = `${clamp((state.remainingSeconds / Math.max(state.estimatedHours * 3600, 1)) * 100, 0, 100)}%`;
  refs.lowPowerToggle.setAttribute('aria-pressed', String(state.lowPowerMode));
  refs.lowPowerToggle.classList.toggle('is-on', state.lowPowerMode);
  refs.lowPowerState.textContent = state.lowPowerMode ? 'ON' : 'OFF';
  refs.speedItems.forEach((item) => {
    const active = item.dataset.speed === speedMode;
    item.classList.toggle('active-speed', active);
    if (active) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
  });
  refs.supplyInternal.classList.toggle('is-active', powerMode === 'internal');
  refs.supplyExternal.classList.toggle('is-active', powerMode === 'external');

  document.body.dataset.alert = alert.className;
  document.body.dataset.powerMode = state.charging ? 'external' : 'internal';
  document.body.dataset.speedMode = speedMode;
}

function readManualInputs() {
  const level = Number(refs.levelInput.value);
  const capacity = Number(refs.capacityInput.value);
  const power = Number(refs.powerInput.value);
  if (!Number.isFinite(level) || !Number.isFinite(capacity) || !Number.isFinite(power) || capacity <= 0 || power <= 0) return;
  state.level = clamp(level, 0, 100);
  state.capacity = capacity;
  state.power = power;
  state.profile = refs.profile.value;
  state.source = state.apiAvailable ? 'battery-api' : 'manual';
  if (!state.apiAvailable) state.charging = refs.powerMode.value === 'external';
  if (state.apiAvailable && state.battery) {
    state.level = Math.round(state.battery.level * 100);
  }
  calculate();
}

function updateManualProfile() {
  const profile = profiles[refs.profile.value];
  if (!profile || refs.profile.value === 'custom') return;
  refs.capacityInput.value = profile.capacity;
  refs.powerInput.value = profile.power;
  readManualInputs();
}

function applyBatteryData(battery) {
  state.battery = battery;
  state.apiAvailable = true;
  state.source = 'battery-api';
  state.level = Math.round(battery.level * 100);
  state.charging = Boolean(battery.charging);
  refs.powerMode.value = state.charging ? 'external' : 'internal';
  state.apiDischargingTime = finitePositive(battery.dischargingTime) ? battery.dischargingTime : null;
  state.chargingTime = finitePositive(battery.chargingTime) ? battery.chargingTime : null;
  if (state.profile !== 'custom') {
    state.capacity = profiles[state.profile].capacity;
    state.power = profiles[state.profile].power;
  }
  refs.levelInput.value = state.level;
  refs.capacityInput.value = state.capacity;
  refs.powerInput.value = state.power;
  calculate();
  setAnnouncer(`Battery Status APIに接続しました。バッテリー残量は${state.level}%です。`);
}

async function connectBattery() {
  if (!('getBattery' in navigator)) {
    state.apiAvailable = false;
    state.source = 'manual';
    state.level = Number(refs.levelInput.value) || DEFAULTS.level;
    state.capacity = Number(refs.capacityInput.value) || DEFAULTS.capacity;
    state.power = Number(refs.powerInput.value) || DEFAULTS.power;
    state.charging = refs.powerMode.value === 'external';
    calculate();
    setAnnouncer('Battery Status APIは利用できないため、手動入力モードで動作しています。');
    return;
  }
  try {
    const battery = await navigator.getBattery();
    const sync = () => applyBatteryData(battery);
    ['chargingchange', 'levelchange', 'chargingtimechange', 'dischargingtimechange'].forEach((eventName) => battery.addEventListener(eventName, sync));
    sync();
  } catch (error) {
    state.apiAvailable = false;
    state.source = 'manual';
    calculate();
    setAnnouncer('端末データを取得できないため、手動入力モードで動作しています。');
  }
}

function tick() {
  if (state.deadlineMs) state.remainingSeconds = Math.max(0, (state.deadlineMs - Date.now()) / 1000);
  const alert = getAlertLevel();
  updateSegmentDisplay(refs.activityTime, formatActivityTime(state.remainingSeconds));
  refs.countdown.textContent = formatActivityTime(state.remainingSeconds);
  refs.countdownProgress.style.width = `${clamp((state.remainingSeconds / Math.max(state.initialSeconds, 1)) * 100, 0, 100)}%`;
  refs.alertTitle.textContent = alert.title;
  refs.alertDetail.textContent = alert.detail;
  document.body.dataset.alert = alert.className;
}

refs.form.addEventListener('input', readManualInputs);
refs.form.addEventListener('change', readManualInputs);
refs.profile.addEventListener('change', updateManualProfile);
refs.sync.addEventListener('click', () => {
  connectBattery();
  setAnnouncer('端末状態の再同期を開始しました。');
});
refs.lowPowerToggle.addEventListener('click', () => {
  state.lowPowerMode = !state.lowPowerMode;
  render();
  setAnnouncer(state.lowPowerMode ? '低電力モードをONにしました。' : '低電力モードをOFFにしました。');
});

setInterval(() => {
  refs.topClock.textContent = nowLabel();
}, 1000);

state.timerId = setInterval(tick, 50);
refs.topClock.textContent = nowLabel();
refs.profile.value = DEFAULTS.profile;
refs.levelInput.value = DEFAULTS.level;
refs.capacityInput.value = DEFAULTS.capacity;
refs.powerInput.value = DEFAULTS.power;
calculate();
connectBattery();
