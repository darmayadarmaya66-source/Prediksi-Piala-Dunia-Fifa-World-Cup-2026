// flagA/flagB pakai kode negara ISO (dipakai untuk ambil gambar PNG bendera dari flagcdn.com)
const matches = [
  {id:'m1', flagA:'es', teamA:'Spanyol', flagB:'nl', teamB:'Belanda', time:'Sab, 27 Jun · 19:00', venue:'Stadion Azteca'},
  {id:'m2', flagA:'ar', teamA:'Argentina', flagB:'au', teamB:'Australia', time:'Sab, 27 Jun · 22:00', venue:'MetLife Stadium'},
  {id:'m3', flagA:'fr', teamA:'Prancis', flagB:'pl', teamB:'Polandia', time:'Min, 28 Jun · 16:00', venue:'SoFi Stadium'},
  {id:'m4', flagA:'gb-eng', teamA:'Inggris', flagB:'sn', teamB:'Senegal', time:'Min, 28 Jun · 19:00', venue:'AT&T Stadium'},
  {id:'m5', flagA:'br', teamA:'Brasil', flagB:'jp', teamB:'Jepang', time:'Sen, 29 Jun · 16:00', venue:'BC Place'},
  {id:'m6', flagA:'de', teamA:'Jerman', flagB:'ma', teamB:'Maroko', time:'Sen, 29 Jun · 19:00', venue:'Estadio BBVA'},
  {id:'m7', flagA:'pt', teamA:'Portugal', flagB:'us', teamB:'Amerika Serikat', time:'Sel, 30 Jun · 16:00', venue:'Mercedes-Benz Stadium'},
  {id:'m8', flagA:'be', teamA:'Belgia', flagB:'hr', teamB:'Kroasia', time:'Sel, 30 Jun · 22:00', venue:'Lumen Field'},
];

// Ambil URL gambar bendera PNG dari flagcdn.com berdasarkan kode negara
function flagUrl(code){
  return `https://flagcdn.com/w80/${code}.png`;
}
function flagImg(code, teamName){
  return `<img class="flag" src="${flagUrl(code)}" alt="Bendera ${teamName}" loading="lazy">`;
}

const state = {
  predictions: {},
  actuals: {},
  bracketPicks: {},
  championGuesses: [],
};

function teamLabel(m, side){
  return side === 'A' ? m.teamA : m.teamB;
}

function renderMatches(){
  const grid = document.getElementById('matchGrid');
  grid.innerHTML = '';
  matches.forEach((m, i) => {
    const pred = state.predictions[m.id];
    const actual = state.actuals[m.id];
    const ticket = document.createElement('div');
    ticket.className = 'ticket';
    ticket.innerHTML = `
      <div class="stub-main">
        ${pred ? `<div class="stamp">predicted</div>` : ''}
        <div class="match-meta"><span>${m.time}</span><span>${m.venue}</span></div>
        <div class="teams-row">
          <div class="team">${flagImg(m.flagA, m.teamA)}<span class="name">${m.teamA}</span></div>
          <div class="vs-or-score">VS</div>
          <div class="team" style="justify-content:flex-end; text-align:right;"><span class="name">${m.teamB}</span>${flagImg(m.flagB, m.teamB)}</div>
        </div>
        <div class="ticket-footer">
          <input class="name-input" id="${m.id}-name" placeholder="Namamu" value="${pred ? pred.name : ''}">
          <div class="score-inputs">
            <input type="number" min="0" max="20" id="${m.id}-scoreA" value="${pred ? pred.scoreA : ''}">
            <span class="mono">:</span>
            <input type="number" min="0" max="20" id="${m.id}-scoreB" value="${pred ? pred.scoreB : ''}">
          </div>
          <button class="btn-predict" data-id="${m.id}">${pred ? 'Update' : 'Tebak'}</button>
        </div>
        ${pred ? `<div class="predicted-tag">${pred.name}: ${m.teamA} ${pred.scoreA}-${pred.scoreB} ${m.teamB}</div>` : ''}
        <div class="admin-row">
          <span>Skor resmi:</span>
          <input type="number" min="0" max="20" id="${m.id}-actualA" value="${actual ? actual.scoreA : ''}">
          <span>-</span>
          <input type="number" min="0" max="20" id="${m.id}-actualB" value="${actual ? actual.scoreB : ''}">
          <button data-id="${m.id}">Simpan</button>
          ${actual ? `<span style="color:var(--gold); margin-left:4px;">FT</span>` : ''}
        </div>
      </div>
      <div class="stub-side"><span>Match</span><span class="num">${String(i+1).padStart(2,'0')}</span></div>
    `;
    grid.appendChild(ticket);
  });

  grid.querySelectorAll('.btn-predict[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = document.getElementById(`${id}-name`).value.trim();
      const a = document.getElementById(`${id}-scoreA`).value;
      const b = document.getElementById(`${id}-scoreB`).value;
      if(!name || a === '' || b === ''){
        alert('Isi nama dan kedua skor dulu, ya.');
        return;
      }
      state.predictions[id] = {name, scoreA: parseInt(a), scoreB: parseInt(b)};
      renderMatches();
      renderLeaderboard();
    });
  });

  grid.querySelectorAll('.admin-row button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const a = document.getElementById(`${id}-actualA`).value;
      const b = document.getElementById(`${id}-actualB`).value;
      if(a === '' || b === ''){
        alert('Masukkan skor akhir resmi kedua tim.');
        return;
      }
      state.actuals[id] = {scoreA: parseInt(a), scoreB: parseInt(b)};
      renderMatches();
      renderLeaderboard();
    });
  });
}

// BRACKET LOGIC
const r16Pairs = matches.map(m => ({matchId: m.id, teamA: teamLabel(m,'A'), teamB: teamLabel(m,'B')}));

function getQF(){
  const qf = [];
  for(let i=0;i<r16Pairs.length;i+=2){
    qf.push({
      id:`qf${i/2}`,
      teamA: state.bracketPicks[r16Pairs[i].matchId] || null,
      teamB: state.bracketPicks[r16Pairs[i+1].matchId] || null,
    });
  }
  return qf;
}
function getSF(qf){
  const sf = [];
  for(let i=0;i<qf.length;i+=2){
    sf.push({
      id:`sf${i/2}`,
      teamA: state.bracketPicks[qf[i].id] || null,
      teamB: state.bracketPicks[qf[i+1].id] || null,
    });
  }
  return sf;
}
function getFinal(sf){
  return {
    id:'final',
    teamA: state.bracketPicks[sf[0].id] || null,
    teamB: state.bracketPicks[sf[1].id] || null,
  };
}

function pickCell(matchId, team, label){
  if(!team) return `<div class="bracket-pick empty">Menunggu hasil</div>`;
  const selected = state.bracketPicks[matchId] === team ? 'selected' : '';
  return `<div class="bracket-pick ${selected}" data-match="${matchId}" data-team="${team}">${team}</div>`;
}

function renderBracket(){
  const qf = getQF();
  const sf = getSF(qf);
  const final = getFinal(sf);
  const champion = state.bracketPicks['final'] || null;

  const wrap = document.getElementById('bracketWrap');
  wrap.innerHTML = `
    <div class="round">
      <div class="round-label">16 besar</div>
      ${r16Pairs.map(p => `
        <div class="bracket-match">
          ${pickCell(p.matchId, p.teamA)}
          ${pickCell(p.matchId, p.teamB)}
        </div>
      `).join('')}
    </div>
    <div class="round">
      <div class="round-label">Perempat final</div>
      ${qf.map(q => `
        <div class="bracket-match">
          ${pickCell(q.id, q.teamA)}
          ${pickCell(q.id, q.teamB)}
        </div>
      `).join('')}
    </div>
    <div class="round">
      <div class="round-label">Semifinal</div>
      ${sf.map(s => `
        <div class="bracket-match">
          ${pickCell(s.id, s.teamA)}
          ${pickCell(s.id, s.teamB)}
        </div>
      `).join('')}
    </div>
    <div class="round">
      <div class="round-label">Final</div>
      <div class="bracket-match">
        ${pickCell(final.id, final.teamA)}
        ${pickCell(final.id, final.teamB)}
      </div>
    </div>
    <div class="round">
      <div class="champion-box">
        <div class="label">Juara dunia</div>
        <div class="pick">${champion || '—'}</div>
      </div>
    </div>
  `;

  wrap.querySelectorAll('.bracket-pick[data-match]').forEach(el => {
    el.addEventListener('click', () => {
      const matchId = el.dataset.match;
      const team = el.dataset.team;
      state.bracketPicks[matchId] = team;
      renderBracket();
    });
  });
}

// CHAMPION GUESS
document.getElementById('champSubmit').addEventListener('click', () => {
  const name = document.getElementById('champName').value.trim();
  const pick = document.getElementById('champPick').value.trim();
  if(!name || !pick){
    alert('Isi nama dan negara pilihanmu dulu, ya.');
    return;
  }
  state.championGuesses = state.championGuesses.filter(g => g.name.toLowerCase() !== name.toLowerCase());
  state.championGuesses.push({name, pick});
  document.getElementById('champName').value = '';
  document.getElementById('champPick').value = '';
  renderChampionList();
  renderLeaderboard();
});

function renderChampionList(){
  const list = document.getElementById('champList');
  if(state.championGuesses.length === 0){
    list.innerHTML = `<div class="empty-state">Belum ada tebakan juara. Jadilah yang pertama.</div>`;
    return;
  }
  list.innerHTML = state.championGuesses.map(g => `
    <div class="champ-list-item"><span class="who">${g.name}</span><span class="what">${g.pick}</span></div>
  `).join('');
}

// ACTUAL CHAMPION (admin sets via bracket final pick implicitly, but allow manual override input on leaderboard tab)
function getActualChampion(){
  return state.bracketPicks['final'] && document.getElementById('actualChampToggle')?.checked
    ? state.bracketPicks['final'] : (state.officialChampion || null);
}

// LEADERBOARD
function computePoints(){
  const points = {};
  function add(name, pts){
    points[name] = (points[name] || 0) + pts;
  }

  matches.forEach(m => {
    const pred = state.predictions[m.id];
    const actual = state.actuals[m.id];
    if(!pred || !actual) return;
    if(pred.scoreA === actual.scoreA && pred.scoreB === actual.scoreB){
      add(pred.name, 10);
    } else {
      const predWinner = pred.scoreA === pred.scoreB ? 'draw' : (pred.scoreA > pred.scoreB ? 'A' : 'B');
      const actualWinner = actual.scoreA === actual.scoreB ? 'draw' : (actual.scoreA > actual.scoreB ? 'A' : 'B');
      if(predWinner === actualWinner) add(pred.name, 5);
    }
  });

  if(state.officialChampion){
    state.championGuesses.forEach(g => {
      if(g.pick.toLowerCase() === state.officialChampion.toLowerCase()){
        add(g.name, 20);
      }
    });
  }

  return Object.entries(points).sort((a,b) => b[1]-a[1]);
}

function renderLeaderboard(){
  const wrap = document.getElementById('lbWrap');
  const ranked = computePoints();

  let officialChampInput = `
    <div class="admin-row" style="margin-bottom:1.2rem; border:1px solid var(--line); border-radius:8px; padding:0.8rem 1rem;">
      <span>Juara dunia resmi (untuk bonus 20 poin):</span>
      <input type="text" id="officialChampInput" style="width:140px;" value="${state.officialChampion || ''}" placeholder="negara">
      <button id="officialChampSave">Simpan</button>
    </div>
  `;

  if(ranked.length === 0){
    wrap.innerHTML = officialChampInput + `<div class="empty-state">Belum ada poin. Isi skor resmi di tab Jadwal untuk mulai menghitung peringkat.</div>`;
  } else {
    wrap.innerHTML = officialChampInput + `
      <div class="leaderboard">
        <div class="lb-row header"><span>Pos</span><span>Nama</span><span style="text-align:right;">Poin</span></div>
        ${ranked.map(([name, pts], i) => `
          <div class="lb-row">
            <span class="lb-rank ${i===0?'top':''}">${i+1}</span>
            <span>${name}</span>
            <span class="lb-points">${pts}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  document.getElementById('officialChampSave').addEventListener('click', () => {
    const val = document.getElementById('officialChampInput').value.trim();
    state.officialChampion = val || null;
    renderLeaderboard();
  });
}

// TABS
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

renderMatches();
renderBracket();
renderChampionList();
renderLeaderboard();
