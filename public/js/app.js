// ═══════════════════════════════════════
// WeatherApp — с радаром RainViewer
// ═══════════════════════════════════════

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn    = document.getElementById('geoBtn');
const appMain   = document.getElementById('appMain');

const DAYS   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

let mapInstance   = null;
let radarLayer    = null;
let chartInstance = null;

// ── ИКОНКИ / ОПИСАНИЯ ──
function icon(c) {
  if (c===0) return '☀️'; if (c<=2) return '⛅'; if (c===3) return '☁️';
  if (c<=48) return '🌫️'; if (c<=55) return '🌦️'; if (c<=65) return '🌧️';
  if (c<=75) return '❄️'; if (c<=82) return '🌨️'; return '⛈️';
}
function desc(c) {
  if (c===0) return 'Ясно'; if (c<=2) return 'Переменная облачность';
  if (c===3) return 'Пасмурно'; if (c<=48) return 'Туман';
  if (c<=55) return 'Морось'; if (c<=65) return 'Дождь';
  if (c<=75) return 'Снег'; if (c<=82) return 'Ливень'; return 'Гроза';
}

// ── ФОН ──
function getBg(c) {
  const n = new Date().getHours(); const night = n<6||n>=20;
  if (night) return 'linear-gradient(160deg,#060c1a,#0d1b2e,#0a2444)';
  if (c===0)  return 'linear-gradient(160deg,#0d4f8c,#1976d2,#42a5f5)';
  if (c<=3)   return 'linear-gradient(160deg,#1c2e3f,#2e4a5e,#546e7a)';
  if (c<=65)  return 'linear-gradient(160deg,#1a2836,#243b4a,#2e5266)';
  return 'linear-gradient(160deg,#0d1b3e,#1a2f6e,#1e3a8a)';
}

function safe(s) {
  return String(s).replace(/[<>"'&]/g, c =>
    ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c]));
}

// ═══════════════════════════════════════
// CANVAS АНИМАЦИЯ ФОНА
// ═══════════════════════════════════════
const cvs = (() => {
  let el = document.getElementById('weather-bg');
  if (!el) { el = document.createElement('canvas'); el.id='weather-bg'; document.body.prepend(el); }
  return el;
})();
const cx = cvs.getContext('2d');
let W=0, H=0, wType='clear', parts=[], strs=[], lastCode=null;

function resize() {
  W = cvs.width  = window.innerWidth;
  H = cvs.height = window.innerHeight;
  genParts();
}

function setEffect(code) {
  lastCode = code;
  if (code===0) wType='clear';
  else if (code<=3) wType='clouds';
  else if (code<=48) wType='fog';
  else if (code<=67||code>=80&&code<=82) wType='rain';
  else if (code>=71&&code<=77) wType='snow';
  else if (code>=95) wType='storm';
  else wType='clouds';
  genParts();
}

function genParts() {
  parts=[]; strs=[];
  const mob = W<768;
  if (wType==='rain') {
    const n = mob?70:130;
    for(let i=0;i<n;i++) parts.push({x:Math.random()*W,y:Math.random()*H,l:12+Math.random()*22,s:9+Math.random()*10});
  }
  if (wType==='snow') {
    const n = mob?50:90;
    for(let i=0;i<n;i++) parts.push({x:Math.random()*W,y:Math.random()*H,r:1.5+Math.random()*3.5,s:0.5+Math.random()*1.5,d:(Math.random()-.5)*.6});
  }
  if (wType==='clouds') {
    for(let i=0;i<(mob?4:8);i++) parts.push({x:Math.random()*W,y:Math.random()*H*.4,r:90+Math.random()*140,s:.1+Math.random()*.2});
  }
  if (wType==='fog') {
    for(let i=0;i<(mob?4:7);i++) parts.push({x:Math.random()*W,y:20+Math.random()*H*.8,r:200+Math.random()*300,s:.15+Math.random()*.2});
  }
  if (wType==='clear' && (new Date().getHours()<6||new Date().getHours()>=20)) {
    for(let i=0;i<(mob?30:60);i++) strs.push({x:Math.random()*W,y:Math.random()*H*.6,r:.8+Math.random()*1.5,a:.2+Math.random()*.8,s:.006+Math.random()*.018});
  }
}

function draw() {
  cx.clearRect(0,0,W,H);

  if (wType==='clear') {
    const g=cx.createRadialGradient(W*.82,H*.15,30,W*.82,H*.15,320);
    g.addColorStop(0,'rgba(255,220,110,.4)'); g.addColorStop(1,'rgba(255,220,110,0)');
    cx.fillStyle=g; cx.fillRect(0,0,W,H);
    strs.forEach(s=>{
      cx.beginPath(); cx.fillStyle=`rgba(255,255,255,${s.a.toFixed(2)})`;
      cx.arc(s.x,s.y,s.r,0,Math.PI*2); cx.fill();
      s.a+=s.s*(Math.random()>.5?1:-1); s.a=Math.max(.1,Math.min(1,s.a));
    });
  }

  if (wType==='rain') {
    cx.strokeStyle='rgba(180,215,255,.5)'; cx.lineWidth=1.3;
    parts.forEach(p=>{
      cx.beginPath(); cx.moveTo(p.x,p.y); cx.lineTo(p.x-2,p.y+p.l); cx.stroke();
      p.y+=p.s; p.x+=.3; if(p.y>H){p.y=-20;p.x=Math.random()*W;}
    });
  }

  if (wType==='snow') {
    cx.fillStyle='rgba(255,255,255,.85)';
    parts.forEach(p=>{
      cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2); cx.fill();
      p.y+=p.s; p.x+=Math.sin(p.y*.01)+p.d;
      if(p.y>H){p.y=-10;p.x=Math.random()*W;}
    });
  }

  if (wType==='clouds'||wType==='fog') {
    parts.forEach(p=>{
      const g=cx.createRadialGradient(p.x,p.y,10,p.x,p.y,p.r);
      g.addColorStop(0,wType==='fog'?'rgba(255,255,255,.08)':'rgba(255,255,255,.07)');
      g.addColorStop(1,'rgba(255,255,255,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2); cx.fill();
      p.x+=p.s; if(p.x-p.r>W) p.x=-p.r;
    });
  }

  if (wType==='storm') {
    if(Math.random()<.015){cx.fillStyle='rgba(255,255,255,.1)';cx.fillRect(0,0,W,H);}
  }

  requestAnimationFrame(draw);
}
resize();
window.addEventListener('resize', resize);
draw();

// ═══════════════════════════════════════
// РАДАР — RainViewer (бесплатно, без ключа)
// ═══════════════════════════════════════
async function initRadar(lat, lon) {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) { mapInstance.remove(); mapInstance=null; radarLayer=null; }

  mapInstance = L.map('map', { zoomControl:true, scrollWheelZoom:false }).setView([lat, lon], 7);

  // Базовая карта — тёмная тема
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  // Маркер города
  L.circleMarker([lat, lon], {
    radius: 7, fillColor: '#42a5f5', color: 'white',
    weight: 2, opacity: 1, fillOpacity: 0.9
  }).addTo(mapInstance);

  // Получаем данные радара от RainViewer
  try {
    const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const d = await r.json();

    const frames = d.radar?.past || [];
    if (frames.length > 0) {
      const latest = frames[frames.length - 1];

      radarLayer = L.tileLayer(
        `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
        { opacity: 0.6, attribution: 'RainViewer', zIndex: 10 }
      ).addTo(mapInstance);

      // Легенда
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div');
        div.style.cssText = 'background:rgba(0,0,0,0.6);padding:8px 12px;border-radius:8px;color:white;font-size:11px;';
        div.innerHTML = '🌧️ Радар осадков<br><span style="opacity:0.6">RainViewer</span>';
        return div;
      };
      legend.addTo(mapInstance);
    }
  } catch(e) {
    console.log('Radar error:', e);
  }

  setTimeout(() => { if(mapInstance) mapInstance.invalidateSize(); }, 100);
}

// ═══════════════════════════════════════
// ГРАФИК ТЕМПЕРАТУРЫ
// ═══════════════════════════════════════
function renderChart(hourly) {
  const el = document.getElementById('tempChart');
  if (!el || typeof Chart === 'undefined') return;
  if (chartInstance) { chartInstance.destroy(); chartInstance=null; }

  const now = new Date();
  const start = (hourly.time||[]).findIndex(t => new Date(t) >= now);
  const labels = (hourly.time||[]).slice(start, start+24).map(t => t.slice(11,16));
  const temps  = (hourly.temperature_2m||[]).slice(start, start+24);
  const pops   = (hourly.precipitation_probability||[]).slice(start, start+24);

  chartInstance = new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '°C', data: temps, borderColor: '#64b5f6', backgroundColor: 'rgba(100,181,246,.1)', tension: .35, pointRadius: 2, borderWidth: 2, yAxisID: 'y' },
        { label: 'Осадки %', data: pops, borderColor: '#80cbc4', backgroundColor: 'rgba(128,203,196,.08)', tension: .35, pointRadius: 2, borderWidth: 2, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: 'rgba(255,255,255,.6)', font: { size: 11 } } } },
      scales: {
        x:  { ticks: { color: 'rgba(255,255,255,.4)', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,.04)' } },
        y:  { ticks: { color: 'rgba(255,255,255,.4)' }, grid: { color: 'rgba(255,255,255,.04)' }, position: 'left' },
        y1: { ticks: { color: 'rgba(128,203,196,.5)' }, grid: { display: false }, position: 'right', min: 0, max: 100 }
      }
    }
  });
}

// ═══════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ — ПОГОДА
// ═══════════════════════════════════════
async function getWeather(lat, lon, cityName) {
  appMain.innerHTML = '<p class="msg">⏳ Загрузка...</p>';

  try {
    const res  = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'ошибка');

    const cur   = data.current;
    const daily = data.daily;
    const hourly= data.hourly;

    setEffect(cur.weathercode);
    document.body.style.background = getBg(cur.weathercode);

    const temp   = Math.round(cur.temperature_2m);
    const feels  = Math.round(cur.apparent_temperature);
    const wind   = Math.round(cur.windspeed_10m ?? 0);
    const wdir   = cur.winddirection_10m ?? 0;
    const gusts  = Math.round(cur.windgusts_10m ?? 0);
    const humid  = cur.relativehumidity_2m ?? '—';
    const precip = cur.precipitation ?? 0;
    const uv     = cur.uv_index ?? '—';
    const vis    = cur.visibility ? (cur.visibility/1000).toFixed(1)+' км' : '—';
    const press  = cur.pressure_msl ? Math.round(cur.pressure_msl)+' гПа' : '—';
    const clouds = cur.cloud_cover ?? '—';

    const sunrise = daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}) : '—';
    const sunset  = daily?.sunset?.[0]  ? new Date(daily.sunset[0]).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})  : '—';
    const dayMax  = Math.round(daily.temperature_2m_max[0]);
    const dayMin  = Math.round(daily.temperature_2m_min[0]);
    const dirs    = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];
    const wdirStr = dirs[Math.round(wdir/45)%8];

    // Почасовой
    const now = new Date();
    const hs  = (hourly.time||[]).findIndex(t => new Date(t) >= now);
    const h24 = (hourly.time||[]).slice(hs, hs+24);
    const ht  = (hourly.temperature_2m||[]).slice(hs, hs+24);
    const hc  = (hourly.weathercode||[]).slice(hs, hs+24);
    const hp  = (hourly.precipitation_probability||[]).slice(hs, hs+24);

    const hourlyHTML = h24.map((t,i) => `
      <div class="hour-card">
        <div class="hour-time">${i===0?'Сейчас':t.slice(11,16)}</div>
        <div class="hour-icon">${icon(hc[i]||0)}</div>
        <div class="hour-temp">${Math.round(ht[i])}°</div>
        ${hp[i]>10 ? `<div class="hour-pop">💧${hp[i]}%</div>` : ''}
      </div>`).join('');

    // 7 дней
    const allMax = Math.max(...daily.temperature_2m_max);
    const allMin = Math.min(...daily.temperature_2m_min);
    const rng    = allMax - allMin || 1;

    const forecastHTML = daily.time.map((t,i) => {
      const mx = Math.round(daily.temperature_2m_max[i]);
      const mn = Math.round(daily.temperature_2m_min[i]);
      const bl = ((mn-allMin)/rng*100).toFixed(0);
      const bw = Math.max(8,((mx-mn)/rng*100)).toFixed(0);
      const d  = new Date(t);
      return `
        <div class="forecast-row">
          <div class="fc-day">${i===0?'Сег.':DAYS[d.getDay()]}</div>
          <div class="fc-icon">${icon(daily.weathercode[i])}</div>
          <div class="fc-desc">${desc(daily.weathercode[i])}</div>
          <div class="fc-min">${mn}°</div>
          <div class="fc-bar"><div class="fc-fill" style="margin-left:${bl}%;width:${bw}%"></div></div>
          <div class="fc-max">${mx}°</div>
        </div>`;
    }).join('');

    appMain.innerHTML = `

      <!-- ГЕРОЙ -->
      <div class="glass hero-card">
        <div>
          <div class="hero-city">📍 ${safe(cityName)}</div>
          <div class="hero-temp">${temp}°C</div>
          <div class="hero-desc">${icon(cur.weathercode)} ${desc(cur.weathercode)}</div>
          <div class="hero-feels">Ощущается как ${feels}°C</div>
          <div class="hero-minmax">↑${dayMax}° ↓${dayMin}°</div>
        </div>
        <div class="hero-icon">${icon(cur.weathercode)}</div>
      </div>

      <!-- МЕТРИКИ -->
      <div class="glass" style="padding:20px">
        <div class="section-title">Подробности</div>
        <div class="metrics-grid">
          <div class="metric"><div class="metric-icon">💧</div><div class="metric-val">${humid}%</div><div class="metric-name">Влажность</div></div>
          <div class="metric"><div class="metric-icon">💨</div><div class="metric-val">${wind} км/ч</div><div class="metric-name">Ветер</div></div>
          <div class="metric"><div class="metric-icon">🧭</div><div class="metric-val">${wdirStr}</div><div class="metric-name">Направление</div></div>
          <div class="metric"><div class="metric-icon">⚡</div><div class="metric-val">${gusts} км/ч</div><div class="metric-name">Порывы</div></div>
          <div class="metric"><div class="metric-icon">🌧️</div><div class="metric-val">${precip} мм</div><div class="metric-name">Осадки</div></div>
          <div class="metric"><div class="metric-icon">🧭</div><div class="metric-val">${press}</div><div class="metric-name">Давление</div></div>
          <div class="metric"><div class="metric-icon">☀️</div><div class="metric-val">${uv}</div><div class="metric-name">UV индекс</div></div>
          <div class="metric"><div class="metric-icon">☁️</div><div class="metric-val">${clouds}%</div><div class="metric-name">Облачность</div></div>
          <div class="metric"><div class="metric-icon">👁️</div><div class="metric-val">${vis}</div><div class="metric-name">Видимость</div></div>
          <div class="metric"><div class="metric-icon">🌅</div><div class="metric-val">${sunrise}</div><div class="metric-name">Восход</div></div>
          <div class="metric"><div class="metric-icon">🌇</div><div class="metric-val">${sunset}</div><div class="metric-name">Закат</div></div>
        </div>
      </div>

      <!-- ПОЧАСОВОЙ -->
      <div class="glass" style="padding:20px">
        <div class="section-title">Почасовой прогноз</div>
        <div class="hourly-scroll">${hourlyHTML}</div>
      </div>

      <!-- 7 ДНЕЙ -->
      <div class="glass" style="padding:20px">
        <div class="section-title">📅 Прогноз на 7 дней</div>
        ${forecastHTML}
      </div>

      <!-- РАДАР + ГРАФИК -->
      <div class="two-col">
        <div class="glass" style="padding:20px">
          <div class="section-title">🌧️ Радар осадков</div>
          <div id="map"></div>
        </div>
        <div class="glass" style="padding:20px">
          <div class="section-title">📈 Температура 24 часа</div>
          <div class="chart-wrap"><canvas id="tempChart"></canvas></div>
        </div>
      </div>

    `;

    initRadar(lat, lon);
    renderChart(hourly);
    await saveToHistory(cityName, lat, lon);
    loadHistory();

  } catch(e) {
    console.error(e);
    appMain.innerHTML = '<p class="msg">❌ Ошибка загрузки. Проверь интернет.</p>';
  }
}

// ═══════════════════════════════════════
// ПОИСК / ГЕО
// ═══════════════════════════════════════
async function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return;
  appMain.innerHTML = '<p class="msg">🔍 Ищем город...</p>';
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`);
    const d = await r.json();
    if (!d.results?.length) { appMain.innerHTML='<p class="msg">❌ Город не найден.</p>'; return; }
    const p = d.results[0];
    await getWeather(p.latitude, p.longitude, p.name+(p.admin1?', '+p.admin1:''));
  } catch { appMain.innerHTML='<p class="msg">❌ Ошибка поиска.</p>'; }
}

function geoLocate() {
  if (!navigator.geolocation) return;
  appMain.innerHTML = '<p class="msg">📍 Определяем местоположение...</p>';
  navigator.geolocation.getCurrentPosition(
    async p => await getWeather(p.coords.latitude, p.coords.longitude, 'Моё местоположение'),
    ()  => { appMain.innerHTML='<p class="msg">❌ Нет доступа к геолокации.</p>'; }
  );
}

// ═══════════════════════════════════════
// ИСТОРИЯ
// ═══════════════════════════════════════
async function saveToHistory(city, lat, lon) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, lat, lon })
    });
  } catch {}
}

async function loadHistory() {
  try {
    const r    = await fetch('/api/history');
    const data = await r.json();
    const old  = document.getElementById('history');
    if (old) old.remove();
    if (!data?.length) return;

    const div = document.createElement('div');
    div.id = 'history';
    div.innerHTML = `
      <div class="history-inner">
        <div class="history-header">
          <span class="section-title" style="margin:0">🕐 История поиска</span>
          <button class="clear-btn" onclick="clearHistory()">Очистить</button>
        </div>
        <div class="history-btns">
          ${data.map(s=>`<button class="history-btn" onclick="getWeather(${s.lat},${s.lon},'${safe(s.city)}')">${safe(s.city)}</button>`).join('')}
        </div>
      </div>`;
    appMain.after(div);
  } catch {}
}

async function clearHistory() {
  try {
    await fetch('/api/history', { method:'DELETE' });
    const old = document.getElementById('history');
    if (old) old.remove();
  } catch {}
}

// ═══════════════════════════════════════
// СОБЫТИЯ + СТАРТ
// ═══════════════════════════════════════
searchBtn.addEventListener('click', searchCity);
geoBtn.addEventListener('click', geoLocate);
cityInput.addEventListener('keydown', e => { if(e.key==='Enter') searchCity(); });

loadHistory();
getWeather(51.18, 71.45, 'Астана');