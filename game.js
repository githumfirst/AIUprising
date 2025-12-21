
// --- Flag visuals (always visible to both sides) ---
const FLAG_SVG = {
  human: (colorClass='flag-human') => `
    <span class="flag-wrap ${colorClass}" aria-label="human-flag">
      <svg viewBox="0 0 64 64" class="flag-svg" role="img" focusable="false">
        <path class="flag-pole" d="M14 6c-1.7 0-3 1.3-3 3v49c0 1.7 1.3 3 3 3s3-1.3 3-3V9c0-1.7-1.3-3-3-3z"/>
        <path class="flag-cloth" d="M18 10c12 0 14 6 28 6 5.5 0 8-1.1 12-3v22c-4 1.9-6.5 3-12 3-14 0-16-6-28-6v-22z"/>
        <path class="flag-shine" d="M20 12c10 0 13 5 25 5 4.2 0 6.3-.7 9-1.8v4.4c-2.7 1.1-4.8 1.8-9 1.8-12 0-15-5-25-5v-4.4z"/>
      </svg>
    </span>`,
  ai: (colorClass='flag-ai') => `
    <span class="flag-wrap ${colorClass}" aria-label="ai-flag">
      <svg viewBox="0 0 64 64" class="flag-svg" role="img" focusable="false">
        <path class="flag-pole" d="M14 6c-1.7 0-3 1.3-3 3v49c0 1.7 1.3 3 3 3s3-1.3 3-3V9c0-1.7-1.3-3-3-3z"/>
        <path class="flag-cloth" d="M18 10c12 0 14 6 28 6 5.5 0 8-1.1 12-3v22c-4 1.9-6.5 3-12 3-14 0-16-6-28-6v-22z"/>
        <path class="flag-shine" d="M20 12c10 0 13 5 25 5 4.2 0 6.3-.7 9-1.8v4.4c-2.7 1.1-4.8 1.8-9 1.8-12 0-15-5-25-5v-4.4z"/>
      </svg>
    </span>`
};
(() => {
  // ---------- Data ----------
  const ROWS = 8;
  const COLS = 7;
  const HUMAN = 'H';
  const CPU = 'C';

  // ---------- SFX ----------
  const SFX_URL = {
    [HUMAN]: ['sfx/move_player.wav', 'move_player.wav'],
    [CPU]:   ['sfx/move_enemy.wav',  'move_enemy.wav']
  };

  // Many browsers require a user gesture before audio will play.
  // We'll "unlock" the audio on the first pointer interaction.
  let sfxUnlocked = false;
  const sfxPool = { [HUMAN]: [], [CPU]: [] };
  const SFX_POOL_SIZE = 4;

  
function pickSfxUrl(side){
  const v = SFX_URL[side];
  return Array.isArray(v) ? v[0] : v;
}

function initSfx(){
    for(const side of [HUMAN, CPU]){
      for(let i=0;i<SFX_POOL_SIZE;i++){
        const a = new Audio(pickSfxUrl(side));
        a.addEventListener('error', ()=>{
          const v = SFX_URL[side];
          if(Array.isArray(v) && a.src && !a._fallbackTried){
            a._fallbackTried = true;
            a.src = v[1];
            a.load();
          }
        });
        a.preload = 'auto';
        a.volume = 0.35;
        sfxPool[side].push(a);
      }
    }
    document.addEventListener('pointerdown', unlockSfx, { once:true, passive:true });
    document.addEventListener('keydown', unlockSfx, { once:true });
  }

  function unlockSfx(){
    if(sfxUnlocked) return;
    sfxUnlocked = true;
    // Attempt a zero-volume play/pause to satisfy gesture requirements.
    for(const side of [HUMAN, CPU]){
      for(const a of sfxPool[side]){
        const prevVol = a.volume;
        a.volume = 0.0;
        try{
          const p = a.play();
          if(p && typeof p.then==='function'){
            p.then(()=>{ a.pause(); a.currentTime = 0; a.volume = prevVol; }).catch(()=>{ a.volume = prevVol; });
          } else {
            a.pause(); a.currentTime = 0; a.volume = prevVol;
          }
        }catch(_e){
          a.volume = prevVol;
        }
      }
    }
  }

  function playMoveSfx(side){
    // If not unlocked yet, do nothing (prevents console noise).
    if(!sfxUnlocked) return;
    const pool = sfxPool[side] || [];
    if(!pool.length) return;
    // Find an available Audio element, fall back to the first one.
    let a = pool.find(x => x.paused || x.ended) || pool[0];
    try{
      a.currentTime = 0;
      a.play();
    }catch(_e){}
  }

  let suppressSfxOnce = false;

  initSfx();

  /**
   * 말 구성:
   * - 특수: 대통령 1, 헌병 1
   * - 일반 계급: 나머지
   */
  const RANKS = [
    
    { id:'FLAG', name:'',     power: 0, special:'FLAG' },
{ id:'E2',  name:'PVT',   power: 1 },
    { id:'E1',  name:'PFC',   power: 2 },
    { id:'S3',  name:'SPC',   power: 3 },
    { id:'CPL', name:'CPL',     power: 4 },
    { id:'SGT', name:'SGT',     power: 5 },
    { id:'SSG', name:'SSG',     power: 6 },
    { id:'SFC', name:'SFC',     power: 7 },
    // 원사 제거
    { id:'2LT', name:'2LT',     power: 9 },
    { id:'1LT', name:'1LT',     power:10 },
    { id:'CPT', name:'CPT',     power:11 },
    { id:'MAJ', name:'MAJ',     power:12 },
    { id:'LTC', name:'LTC',     power:13 },
    { id:'COL', name:'COL',     power:14 },
    { id:'BG',  name:'BG',     power:15 },
    { id:'MG',  name:'MG',     power:16 },
    { id:'LTG', name:'LTG',     power:17 },
    { id:'GEN', name:'GEN',     power:18 },

    // 특수
    { id:'ACC', name:'Sniper', power:0, special:'ACC', ins:{ kind:'badge', lines:3 } },
    { id:'PRES',name:'VIP',   power:99, special:'PRES' },
    { id:'MP',  name:'MP',     power:98, special:'MP' },
  ];

  const rankById = Object.fromEntries(RANKS.map(r => [r.id, r]));

  // 계급장(간단 아이콘) 표시: 대통령/헌병만 텍스트
  function insigniaFor(rankId){
    const spec = ((rankById[rankId] && rankById[rankId].special))||null;
    if(spec==='PRES') return {kind:'text', text:'VIP'};
    if(spec==='MP')   return {kind:'text', text:'MP'};    if(spec==='FLAG') return {kind:'text', text:'⚑'};
    // 병: 노란 줄(1~4)
    const stripes = { 'E2':1, 'E1':2, 'S3':3, 'CPL':4 };
    if(stripes[rankId]) return {kind:'stripes', n:stripes[rankId]};

    // 부사관: 갈매기(하사/중사/상사 = 1~3)
    const chevs = { 'SGT':1, 'SSG':2, 'SFC':3 };
    if(chevs[rankId]) return {kind:'chevrons', n:chevs[rankId]};
// 위관(소위/중위/대위): 은색 다이아 1~3
    const company = { '2LT':1, '1LT':2, 'CPT':3 };
    if(company[rankId]) return {kind:'diamonds', n:company[rankId], gold:false};

    // 영관(소령/중령/대령): 무궁화(꽃) 1~3개
    const field = { 'MAJ':1, 'LTC':2, 'COL':3 };
    if(field[rankId]) return {kind:'flowers', n:field[rankId]};

    // 장군: 별 1~4
    const stars = { 'BG':1, 'MG':2, 'LTG':3, 'GEN':4 };
    if(stars[rankId]) return {kind:'stars', n:stars[rankId]};

    return {kind:'text', text:'?'};
  }

  // Board cell: null or { side, rankId, revealedForHuman:boolean, revealedForCPU:boolean, uid }
  let board;
  let turn = HUMAN;       // 번갈아 진행: HUMAN -> CPU -> HUMAN -> ...
  let selected = null;    // {r,c}
  let legalTargets = [];  // {r,c,type:'move'|'cap'}
  let gameOver = false;
  // Objectives: to win you must capture enemy flag AND remove enemy president (order doesn't matter), OR annihilate.
  let obj = { human:{flag:false,pres:false}, cpu:{flag:false,pres:false} };
  let lastMove = null; // {from:{r,c}, to:{r,c}, side, ts}
  let lastActor = null;
  let lastCpuMoverUid = null; // to avoid moving the same CPU piece repeatedly
  let battlePending = null; // {from,to, mover, dest, result}
  let inputLocked = false;

  const elBoard = document.getElementById('board');
  const elTurnPill = document.getElementById('turnPill');
  const elTurnTimer = document.getElementById('turnTimer');
  const elCpuOverlay = document.getElementById('cpuAttackOverlay');
  const elCountH = document.getElementById('countH');
  const elCountC = document.getElementById('countC');
  const elToast = document.getElementById('toast');
  const elEventBar = document.getElementById('eventBar');
  const elWinRate = document.getElementById('winRate');
  const elLastActor = document.getElementById('lastActorPill');
  const elLastMove = document.getElementById('lastMovePill');

  const elBattleBanner = document.getElementById('battleBanner');
  const elBattleBannerTitle = document.getElementById('battleBannerTitle');
  const elBattleBannerSub = document.getElementById('battleBannerSub');

  const elOverlay = document.getElementById('resultOverlay');
  const elResultTitle = document.getElementById('resultTitle');
  const elResultSub = document.getElementById('resultSub');
  const elBtnPlayAgain = document.getElementById('btnPlayAgain');

  // Debug view: reveal AI ranks only when user explicitly toggles.
  let debugRevealCpuRanks = false;
  const elBtnView = document.getElementById('btnView');

  document.getElementById('btnNew').addEventListener('click', () => newGame());
    renderWinRate();
    if(elBtnPlayAgain) elBtnPlayAgain.addEventListener('click', () => newGame());

  if(elBtnView){
    elBtnView.addEventListener('click', ()=>{
      debugRevealCpuRanks = !debugRevealCpuRanks;
      elBtnView.setAttribute('aria-pressed', String(debugRevealCpuRanks));
      elBtnView.textContent = debugRevealCpuRanks ? 'Hide' : 'Reveal';
      render();
    });
  }

  // ---------- Helpers ----------
  const inBounds = (r,c) => r>=0 && r<ROWS && c>=0 && c<COLS;
  const rand = (n) => Math.floor(Math.random()*n);

  // ---------- Win Rate (localStorage) ----------
  const WINRATE_KEY = 'hva_winrate_v1';
  function readWinRate(){
    try{
      const raw = localStorage.getItem(WINRATE_KEY);
      if(!raw) return { human:0, ai:0 };
      const obj = JSON.parse(raw);
      return {
        human: Number(obj?.human)||0,
        ai: Number(obj?.ai)||0,
      };
    }catch(e){
      return { human:0, ai:0 };
    }
  }
  function writeWinRate(v){
    try{ localStorage.setItem(WINRATE_KEY, JSON.stringify(v)); }catch(e){}
  }
  function renderWinRate(){
    if(!elWinRate) return;
    const v = readWinRate();
    // 2-line layout
    elWinRate.innerHTML = '<div class="wrLabel">Human vs AI</div>' +
                          '<div class="wrScore"><span class="wrH">'+v.human+
                          '</span><span class="wrSep"> : </span><span class="wrA">'+v.ai+'</span></div>';
  }
  function bumpWinRate(winnerSide){
    const v = readWinRate();
    if(winnerSide === 'human') v.human += 1;
    if(winnerSide === 'ai') v.ai += 1;
    writeWinRate(v);
    renderWinRate();
  }
  // ---------- Turn Timer (Human only) ----------

// --- Turn timeout "whoosh" (air leak) ---
let whooshCtx = null;
function playWhooshSfx(){
  try{
    // Requires user gesture in many browsers; reuse sfxUnlocked gate.
    if(!sfxUnlocked) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    whooshCtx = whooshCtx || new AC();
    // If context is suspended, resume (best effort)
    if(whooshCtx.state === 'suspended'){
      whooshCtx.resume().catch(()=>{});
    }

    const ctx = whooshCtx;
    const now = ctx.currentTime;

    // Noise source
    const bufferSize = Math.floor(ctx.sampleRate * 0.30);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      // white noise
      data[i] = (Math.random()*2-1) * 0.9;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    // Bandpass + lowpass to feel like "air"
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, now);
    bp.Q.setValueAtTime(0.8, now);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1800, now);
    lp.Q.setValueAtTime(0.7, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    src.connect(bp);
    bp.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);

    src.start(now);
    src.stop(now + 0.30);
  }catch(_e){}
}

  const TURN_LIMIT_SEC = 10;  // 인간 플레이 시간 10초
  let turnTimerLeft = TURN_LIMIT_SEC;
  let turnTimerInterval = null;

  function renderTurnTimer(){
  if(!elTurnTimer) return;
  if(gameOver || turn !== HUMAN){
    elTurnTimer.innerHTML = '';
    elTurnTimer.classList.remove('danger');
    return;
  }
  const danger = (turnTimerLeft <= 3);
  elTurnTimer.classList.toggle('danger', danger);
  elTurnTimer.innerHTML = `<span class="timerIcon" aria-hidden="true">⏱</span><span class="timerNum ${danger ? 'danger' : ''}"></span>`;
  const numEl = elTurnTimer.querySelector('.timerNum');
  if(numEl){
    numEl.textContent = String(turnTimerLeft);
    numEl.classList.toggle('danger', danger);
  }
}

  function stopTurnTimer(){
    if(turnTimerInterval){
      window.clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
    if(elTurnTimer){ elTurnTimer.innerHTML = ''; elTurnTimer.classList.remove('danger'); }
  }

  function startHumanTurnTimer(){
    stopTurnTimer();
    turnTimerLeft = TURN_LIMIT_SEC;
    renderTurnTimer();
    turnTimerInterval = window.setInterval(()=>{
      if(gameOver || turn !== HUMAN){
        stopTurnTimer();
        return;
      }
      turnTimerLeft -= 1;
      if(turnTimerLeft <= 0){
        // 1초가 지나 0초로 넘어가는 순간 효과음
        playWhooshSfx();
        stopTurnTimer();
        // Time out: pass turn to AI
        clearSelection();
        render();
        setTurn(CPU);
        render();
        if(turn === CPU) setTimeout(aiTurn, 1500);
        return;
      }
      renderTurnTimer();
    }, 1000);
  }


  function positionBattleBanner(from, to){
    // Position banner near the clash (midpoint of from/to squares). Fallback: centered.
    try{
      const a = elBoard.querySelector(`.sq[data-r="${from.r}"][data-c="${from.c}"]`);
      const b = elBoard.querySelector(`.sq[data-r="${to.r}"][data-c="${to.c}"]`);
      if(!a || !b) throw new Error('no squares');
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const ax = ra.left + ra.width/2, ay = ra.top + ra.height/2;
      const bx = rb.left + rb.width/2, by = rb.top + rb.height/2;
      const x = (ax+bx)/2, y = (ay+by)/2;
      elBattleBanner.style.left = `${x}px`;
      elBattleBanner.style.top  = `${y}px`;
      elBattleBanner.classList.add('pos');
    }catch(e){
      elBattleBanner.classList.remove('pos');
      elBattleBanner.style.left = '';
      elBattleBanner.style.top  = '';
    }
  }

  function showBattleBanner(from, to, mover, dest, result, ms=2000){
    if(!elBattleBanner) return;

    // Determine which side is "ours" vs "enemy" regardless of who moved
    const ourPiece   = (mover.side===HUMAN) ? mover : dest;
    const enemyPiece = (ourPiece===mover) ? dest : mover;

    // Winner/loser mapping
    let winner = null; // 'our' | 'enemy' | 'both'
    if(result==='both') winner = 'both';
    else if(result==='att') winner = (mover===ourPiece) ? 'our' : 'enemy';
    else if(result==='def') winner = (dest===ourPiece) ? 'our' : 'enemy';

    // Explosion icon + text
    if(elBattleBannerTitle){
      elBattleBannerTitle.innerHTML = `
        <span class="boomWrap" aria-hidden="true">
          <span class="boomIcon"></span>
          <span class="boomText">Boom!</span>
        </span>`;
    }

    // 충돌/전투 결과를 텍스트로 표시 (하단 영역의 아이콘/표식 대신)
    if(elBattleBannerSub){
      elBattleBannerSub.classList.remove('aiWin');
      if(winner === 'our') elBattleBannerSub.textContent = 'Human wins!';
      else if(winner === 'enemy') { elBattleBannerSub.textContent = 'AI wins!'; elBattleBannerSub.classList.add('aiWin'); }
      else elBattleBannerSub.textContent = 'Both eliminated!';
    }

    positionBattleBanner(from, to);

    elBattleBanner.classList.add('show');
    elBattleBanner.setAttribute('aria-hidden','false');
    window.clearTimeout(showBattleBanner._t);
    showBattleBanner._t = window.setTimeout(()=>{
      elBattleBanner.classList.remove('show');
      elBattleBanner.setAttribute('aria-hidden','true');
    }, ms);
  }

  function toast(msg){
    elToast.textContent = msg;
    elToast.classList.add('show');
    setTimeout(()=>elToast.classList.remove('show'), 1400);
  }

  // Important announcements (top-left, under title)
  function clearEventBar(){
    if(!elEventBar) return;
    elEventBar.innerHTML = '';
    elEventBar.classList.remove('show');
  }

  function announceImportant(msg, ms=2400){
    if(!elEventBar) return;

    // Turn the single-line event bar into a persistent, scrollable log.
    // Each call appends a new entry (old entries remain for reference).
    const row = document.createElement('div');
    row.className = 'eventLogEntry';
    row.textContent = msg;

    // Optional: add a tiny timestamp (comment out if you don't want it)
    // const ts = document.createElement('span');
    // ts.className = 'eventLogTs';
    // ts.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    // row.prepend(ts);

    elEventBar.appendChild(row);

    // Keep the bar visible once the first event arrives.
    elEventBar.classList.add('show');

    // Auto-scroll to newest message.
    elEventBar.scrollTop = elEventBar.scrollHeight;

    // Cap log length to prevent unbounded DOM growth.
    const MAX_LOG = 60;
    while(elEventBar.children.length > MAX_LOG){
      elEventBar.removeChild(elEventBar.firstElementChild);
    }
  }

  function showOverlay(kind, sub){
    stopTurnTimer();
    if(!elOverlay) return;
    const win = (kind==='win');
    const lose = (kind==='lose');
    const draw = (kind==='draw');

    if(win) bumpWinRate('human');
    else if(lose) bumpWinRate('ai');

    elResultTitle.textContent = win ? 'YOU WIN!' : (lose ? 'YOU LOSE' : 'DRAW');
    elResultTitle.classList.toggle('lose', lose);
    elResultTitle.classList.toggle('draw', draw);

    elResultSub.textContent = sub || (win ? 'Enemy VIP eliminated.' : (lose ? 'Your VIP was eliminated.' : 'Draw.'));

    elOverlay.classList.add('show');
    elOverlay.setAttribute('aria-hidden','false');
  }

  function hideOverlay(){
    if(!elOverlay) return;
    elOverlay.classList.remove('show');
    elOverlay.setAttribute('aria-hidden','true');
  }

  function countPieces(){
    let h=0,c=0;
    for (let r=0;r<ROWS;r++) for(let col=0;col<COLS;col++){
      const p = board[r][col];
      if(!p) continue;
      if(p.side===HUMAN) h++; else c++;
    }
    elCountH.textContent = h;
    elCountC.textContent = c;
  }

  function findPresident(side){
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      const p = board[r][c];
      if(p && p.side===side && p.rankId==='PRES') return {r,c};
    }
    return null;
  }

  function findFlag(side){
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      const p = board[r][c];
      if(p && p.side===side && p.rankId==='FLAG') return {r,c};
    }
    return null;
  }


  
  function setLastMove(from, to, side){
    lastMove = { from, to, side, ts: Date.now() };
    lastActor = (side === HUMAN ? 'Human' : 'AI');
    if(elLastActor) elLastActor.textContent = lastActor;
    if(elLastMove) elLastMove.textContent = `(${from.r+1},${from.c+1})→(${to.r+1},${to.c+1})`;
  }

  function setTurn(next){
    turn = next;
    if(!elTurnPill) return;
    if(turn===HUMAN){
      elTurnPill.textContent = 'Your Turn';
    } else {
      // 컴퓨터 순서일 때: "악마 공격중" (텍스트 '악마'는 쓰지 않고 아이콘으로 표현)
      elTurnPill.innerHTML = `<span class="turnDevil devilIcon" aria-hidden="true"></span><span class="turnAttacking"> Attacking</span>`;
    }
    // 중앙 오버레이(컴퓨터 공격중) 표시
    if(elCpuOverlay){
      if(turn===CPU){
        elCpuOverlay.innerHTML = `<span class="devilIcon" aria-hidden="true"></span><span class="cpuAttackText"> Attacking</span>`;
        // Position relative to the board (centered horizontally, ~4/5 toward the top from the vertical center)
        try{
          const r = ((elBoard && elBoard.getBoundingClientRect) ? elBoard.getBoundingClientRect() : null);
          if(r){
            elCpuOverlay.style.left = (r.left + r.width/2) + "px";
            elCpuOverlay.style.top  = (r.top  + r.height*0.18) + "px";
          }
        }catch(e){}
        elCpuOverlay.classList.remove('hidden');
      } else {
        elCpuOverlay.classList.add('hidden');
      }
    }
    document.body.classList.toggle('turn-human', turn===HUMAN);
    document.body.classList.toggle('turn-cpu', turn===CPU);

    if(turn===HUMAN) startHumanTurnTimer(); else stopTurnTimer();
    renderTurnTimer();
  }

  // ---------- Setup ----------
  function emptyBoard(){
    board = Array.from({length:ROWS}, () => Array.from({length:COLS}, () => null));
  }

  function randomSetupFor(side){
    // side placement zones: CPU rows 0-2, HUMAN rows (ROWS-3..ROWS-1)
    const zoneRows = side===CPU ? [0,1,2] : [ROWS-3, ROWS-2, ROWS-1];
    const cells = [];
    for(const r of zoneRows) for(let c=0;c<COLS;c++) cells.push({r,c});

    // place flags at fixed positions
    const flagPos = (side===CPU) ? {r:0,c:Math.floor(COLS/2)} : {r:ROWS-1,c:Math.floor(COLS/2)};
    board[flagPos.r][flagPos.c] = {
      side,
      rankId: 'FLAG',
      revealedForHuman: side===HUMAN,
      revealedForCPU: side===CPU,
      uid: side + '-FLAG-' + Math.random().toString(16).slice(2)
    };


    // choose 20 distinct ranks (as defined above)
    const pieces = RANKS.filter(r => r.id!=='FLAG').map(r => r.id);

    const availableCells = cells.filter(({r,c}) => !board[r][c]);

    // CPU 대통령은 새 게임 시작 시 맨 윗줄(0번째 줄)에만 배치
    if(side===CPU){
      const presIdx = pieces.indexOf('PRES');
      if(presIdx !== -1){
        const topCells = availableCells.filter(pos => pos.r===0);
        const presCell = (topCells.length ? topCells[rand(topCells.length)] : availableCells[0]);
        if(presCell){
          pieces.splice(presIdx, 1);
          board[presCell.r][presCell.c] = {
            side,
            rankId: 'PRES',
            revealedForHuman: side===HUMAN, // 내 말은 항상 내가 봄
            revealedForCPU: side===CPU,
            uid: side + '-PRES-' + Math.random().toString(16).slice(2)
          };
          const rm = availableCells.findIndex(x => x.r===presCell.r && x.c===presCell.c);
          if(rm !== -1) availableCells.splice(rm, 1);
        }
      }
    }

    // shuffle cells and pieces
    for (let i=availableCells.length-1;i>0;i--){
      const j=rand(i+1); [availableCells[i],availableCells[j]]=[availableCells[j],availableCells[i]];
    }
    for (let i=pieces.length-1;i>0;i--){
      const j=rand(i+1); [pieces[i],pieces[j]]=[pieces[j],pieces[i]];
    }

    for (let i=0;i<pieces.length;i++){
      const {r,c} = availableCells[i];
      board[r][c] = {
        side,
        rankId: pieces[i],
        revealedForHuman: side===HUMAN, // 내 말은 항상 내가 봄
        revealedForCPU: side===CPU,
        uid: side + '-' + pieces[i] + '-' + Math.random().toString(16).slice(2)
      };
    }
  }

  function newGame(){

    // ✅ 이전 판에서 예약된 타이머(비동기 작업) 끊기
    window.clearTimeout(doMove._battleT);        // 전투 2초 후 resolveBattle 예약 취소
    window.clearTimeout(showBattleBanner._t);    // 배너 자동숨김 타이머 취소 

    battlePending = null;     // 혹시 남아있던 전투 상태 제거
    inputLocked = false;      // 입력 잠금 해제

    // ✅ (강추) 승리조건 누적 상태도 리셋
    obj = { human:{flag:false,pres:false}, cpu:{flag:false,pres:false} };

    hideOverlay();
    clearEventBar();
    stopTurnTimer();
    emptyBoard();
    randomSetupFor(CPU);
    randomSetupFor(HUMAN);
    selected = null;
    legalTargets = [];
    gameOver = false;
    setTurn(HUMAN);
    render();
  }

  // ---------- Movement ----------
  const dirs8 = [
    [-1,-1],[-1,0],[-1,1],
    [ 0,-1],       [ 0,1],
    [ 1,-1],[ 1,0],[ 1,1],
  ];

  function isPresidentMoveAllowed(piece, from, to){
    if(piece.rankId !== 'PRES') return true;
    const dr = to.r - from.r;
    const dc = to.c - from.c;

    // must be one step
    if(Math.abs(dr)>1 || Math.abs(dc)>1) return false;
    if(dr===0 && dc===0) return false;

    // HUMAN president cannot move backward; CPU president can move in all 8 directions
    const forwardDr = (piece.side===HUMAN) ? -1 : 1;

    // backward directions are dr === -forwardDr (including backward diagonals)
    if(piece.side===HUMAN && dr === -forwardDr) return false;

    return true;
  }

  function getLegalTargets(from){
    const piece = board[from.r][from.c];
    if(!piece) return [];
    if(piece.rankId==='FLAG') return [];

    const out=[];
    for(const [dr,dc] of dirs8){
      const r=from.r+dr, c=from.c+dc;
      if(!inBounds(r,c)) continue;
      const to = {r,c};
      if(!isPresidentMoveAllowed(piece, from, to)) continue;

      const dest = board[r][c];
      if(!dest){
        out.push({r,c,type:'move'});
      } else if(dest.side !== piece.side){
        out.push({r,c,type:'cap'});
      }
    }
    return out;
  }

  // ---------- Battle Rules ----------
  function battle(att, def){
  // returns: 'att'|'def'|'both'
  const A = rankById[att.rankId];
  const D = rankById[def.rankId];

  const aSpec = (A && A.special) || null; // 'PRES' | 'MP' | null
  const dSpec = (D && D.special) || null;

  // 같은 계급(동일 id 또는 동일 이름)은 무승부: 서로 제거
  if(att.rankId === def.rankId || (A && D && A.name === D.name)) return 'both';

  // ----- 전투 판정 우선순위(요청 규칙) -----
  // 0) 은 누구에게나 패배, 을 잡으면 즉시 승리 조건(별도 체크)
  if(dSpec==='FLAG') return 'att';
  if(aSpec==='FLAG') return 'def';

  // 1) 대통령(PRES)은 누구에게나 패배
  if(aSpec==='PRES') return 'def';
  if(dSpec==='PRES') return 'att';

  // 2) 헌병(MP)은 누구에게나 패배 (동일 계급은 위에서 'both')
  if(aSpec==='MP') return 'def';
  if(dSpec==='MP') return 'att';

  

// 2.5) 별잡이(ACC): 모두에게 지지만, '별(★)' 계급에게만 승리
  // - 별 계급: 준장(BG) / 소장(MG) / 중장(LTG) / 대장(GEN)
  const isStarRankId = (id)=> (id==='BG' || id==='MG' || id==='LTG' || id==='GEN');

  if(aSpec==='ACC'){
    return isStarRankId(def.rankId) ? 'att' : 'def';
  }
  if(dSpec==='ACC'){
    return isStarRankId(att.rankId) ? 'def' : 'att';
  }
// 5) 그 외는 계급(power) 높낮이 비교
  if(A.power > D.power) return 'att';
  if(A.power < D.power) return 'def';
  return 'both';
}

  function revealAfterBattle(aPos, dPos){
    // 헌병(MP)과 부딪힌 상대의 계급을 공개(헌병은 전투에서 항상 패배)
    const a = board[aPos.r][aPos.c];
    const d = board[dPos.r][dPos.c];

    const aSpec = a ? ((rankById[a.rankId] && rankById[a.rankId].special) || null) : null;
    const dSpec = d ? ((rankById[d.rankId] && rankById[d.rankId].special) || null) : null;

    // 공격자가 헌병이면 수비자 공개
    if(a && d && aSpec==='MP'){
      d.revealedForHuman = true;
      d.revealedForCPU = true;
      return;
    }
    // 수비자가 헌병이면 공격자 공개
    if(a && d && dSpec==='MP'){
      a.revealedForHuman = true;
      a.revealedForCPU = true;
      return;
    }
  }

  function checkWin(){
    const hPres = findPresident(HUMAN);
    const cPres = findPresident(CPU);
    const hFlag = findFlag(HUMAN);
    const cFlag = findFlag(CPU);

    // Objective progress (no immediate win on flag/president alone)
    // Track newly achieved objectives to avoid repeated toasts.
    const humanTookFlag = !cFlag;
    const cpuTookFlag   = !hFlag;
    const humanGotPres  = !cPres;
    const cpuGotPres    = !hPres;

    if(humanTookFlag && !obj.human.flag){
      obj.human.flag = true;
      toast('Enemy flag captured! Eliminate the VIP to win.');
    }
    if(cpuTookFlag && !obj.cpu.flag){
      obj.cpu.flag = true;
    }
    if(humanGotPres && !obj.human.pres){
      obj.human.pres = true;
      toast('Enemy VIP eliminated! Capture the flag to win.');
    }
    if(cpuGotPres && !obj.cpu.pres){
      obj.cpu.pres = true;
    }

let hCount=0, cCount=0;
    for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const p = board[r][c];
      if(!p) continue;
      if(p.side===HUMAN) hCount++; else cCount++;
    }

    // draw: both sides have no pieces
    if(cCount===0 && hCount===0){
      gameOver = true;
      toast('Draw.');
      showOverlay('draw', 'All units were eliminated.');
      return true;
    }

    const humanWins = (cCount===0) || (obj.human.flag && obj.human.pres);
    const cpuWins   = (hCount===0) || (obj.cpu.flag && obj.cpu.pres);

    if(humanWins && cpuWins){
      gameOver = true;
      toast('Draw.');
      // Prefer to explain the decisive condition
      showOverlay('draw', 'Both sides achieved the win condition simultaneously.');
      return true;
    }

    if(humanWins){
      gameOver = true;
      toast('Victory!');
      const msg = (cCount===0) ? 'All enemy units eliminated.' : 'Enemy flag and VIP eliminated.';
      showOverlay('win', msg);
      return true;
    }
    if(cpuWins){
      gameOver = true;
      toast('Defeat…');
      const msg = (hCount===0) ? 'All your units were eliminated.' : 'Your flag and VIP were eliminated.';
      showOverlay('lose', msg);
      return true;
    }
    return false;
  }

  // ---------- UI / Rendering ----------
  function squareColor(r,c){
    return ((r+c)%2===0) ? 'light' : 'dark';
  }

  function insigniaHTML(ins){
    // ins가 없을 때(예외)도 "적군" 느낌의 아이콘을 사용
    if(!ins) return '<div class="insEnemy" aria-label="Enemy piece (hidden)">😈</div>';
    if(ins.kind==='text'){
      return `<div class="insText">${escapeHtml(ins.text)}</div>`;
    }
    if(ins.kind==='stars'){
      return `<div class="insStars">${'★'.repeat(ins.n)}</div>`;
    }
    if(ins.kind==='stripes'){
      const bars = Array.from({length:ins.n}, ()=>'<span class="bar"></span>').join('');
      return `<div class="insStripes">${bars}</div>`;
    }
    if(ins.kind==='chevrons'){
      const chevs = Array.from({length:ins.n}, ()=>'<span class="chev"></span>').join('');
      return `<div class="insChevrons">${chevs}</div>`;
    }
    if(ins.kind==='flowers'){
      const flowers = Array.from({length:ins.n}, ()=>'<span class="flower"></span>').join('');
      return `<div class="insFlowers">${flowers}</div>`;
    }
    if(ins.kind==='diamonds'){
      const cls = ins.gold ? 'dia gold' : 'dia';
      const dias = Array.from({length:ins.n}, ()=>`<span class="${cls}"></span>`).join('');
      return `<div class="insDiamonds">${dias}</div>`;
    }
    return '<div class="insEnemy" aria-label="Enemy piece (hidden)">😈</div>';
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function pieceLabel(p){
    // human(화면) 기준:
    // - 내 말(HUMAN)은 항상 공개
    // - 상대 말(CPU)은 헌병(MP)과의 충돌로 'revealedForHuman'이 true가 된 경우에만 공개
    const isFlag = ((rankById[p.rankId] && rankById[p.rankId].special)==='FLAG');
    const canSee = isFlag || (p.side===HUMAN) || !!p.revealedForHuman || (debugRevealCpuRanks && p.side===CPU);
    if(!canSee) return { hidden:true, name:'' };

    const rk = rankById[p.rankId];
    const dispName = (p.rankId==='MP') ? 'MP' : ((p.rankId==='ACC') ? 'Sniper' : ((p.rankId==='PRES') ? 'VIP' : ((rk && rk.name) ? rk.name : '')));
    const noIns = (p.rankId==='PRES' || p.rankId==='MP' || p.rankId==='ACC');
    return { hidden:false, ins: noIns ? null : insigniaFor(p.rankId), name: dispName };
  }

  function render(){
    elBoard.innerHTML = '';

    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const sq = document.createElement('div');
        sq.className = `sq ${squareColor(r,c)}`;
        sq.dataset.r = r;
        sq.dataset.c = c;

        if(lastMove && lastMove.to && lastMove.to.r===r && lastMove.to.c===c){
          sq.classList.add('last-move');
        }

        if(battlePending && ((battlePending.from.r===r && battlePending.from.c===c) || (battlePending.to.r===r && battlePending.to.c===c))){
          sq.classList.add('clash');
        }

        const p = board[r][c];
        if(p){
          const card = document.createElement('div');
          card.className = `piece ${p.side===HUMAN ? 'p-h' : 'p-c'}`;
          const lab = pieceLabel(p);
                    
const spec = ((rankById[p.rankId] && rankById[p.rankId].special))||null;
// Make special pieces visually distinctive ONLY when the piece is actually visible (no info leak).
if(!lab.hidden){
  if(spec==='PRES') card.classList.add('rank-pres');  if(spec==='MP')   card.classList.add('rank-mp');
  if(spec==='ACC')  card.classList.add('rank-acc');
}
if(spec==='FLAG') { card.classList.add('rank-flag'); card.classList.add(p.side===HUMAN ? 'flag-human' : 'flag-ai'); }
const isFlag = ((rankById[p.rankId] && rankById[p.rankId].special)==='FLAG');
const topHtml = isFlag
            ? ((p.side===HUMAN) ? FLAG_SVG.human('flag-human') : FLAG_SVG.ai('flag-ai'))
            : (lab.hidden ? '<div class="insEnemy" aria-label="Enemy piece (hidden)">😈</div>' : insigniaHTML(lab.ins));

          card.innerHTML = `
            <div class="insigniaWrap">${topHtml}</div>
            <div class="small">${(typeof isFlag!=='undefined' && isFlag) ? '' : (lab.hidden ? '' : lab.name)}</div>
          `;
          sq.appendChild(card);

          if(selected && selected.r===r && selected.c===c) sq.classList.add('selectRing');
        }

        const t = legalTargets.find(x => x.r===r && x.c===c);
        if(t){
          sq.classList.add(t.type==='cap' ? 'hintCapture' : 'hintMove');
        }

        sq.addEventListener('click', onSquareClick);
        elBoard.appendChild(sq);
      }
    }

    countPieces();
    if(!gameOver){
      elTurnPill.textContent = (turn===HUMAN ? 'Your Turn' : 'AI Turn');
      document.body.classList.toggle('turn-human', turn===HUMAN);
      document.body.classList.toggle('turn-cpu', turn===CPU);
    }
    renderTurnTimer();
  }

  function clearSelection(){
    selected = null;
    legalTargets = [];
  }

  // ---------- Turns ----------
  function onSquareClick(e){
    if(gameOver) return;
    if(inputLocked) return;
    if(turn !== HUMAN) return; // 사람 턴에만 입력 허용 (번갈아 1번씩)

    const r = Number(e.currentTarget.dataset.r);
    const c = Number(e.currentTarget.dataset.c);
    const p = board[r][c];

    // select my piece
    if(p && p.side===HUMAN){
      selected = {r,c};
      legalTargets = getLegalTargets(selected);
      render();
      return;
    }

    // move selected to target
    if(selected){
      const t = legalTargets.find(x => x.r===r && x.c===c);
      if(!t) return;
      doMove(selected, {r,c});
    }
  }

  function doMove(from, to){
    const mover = board[from.r][from.c];
    const dest  = board[to.r][to.c];
    if(!mover) return;

    if(suppressSfxOnce){
      suppressSfxOnce = false;
    } else {
      playMoveSfx(mover.side);
    }

    setLastMove(from, to, mover.side);

    if(!dest){
      // move
      board[to.r][to.c] = mover;
      board[from.r][from.c] = null;
      } else {
      // battle (show banner first, then resolve after ~1s)
      revealAfterBattle(from, to);
      const result = battle(mover, dest);
      const moverName = rankById[mover.rankId].name;
      const destName  = rankById[dest.rankId].name;
      showBattleBanner(from, to, mover, dest, result, 2000);

      inputLocked = true;
      battlePending = { from, to, mover, dest, result };
      clearSelection();
      render();

      window.clearTimeout(doMove._battleT);
      doMove._battleT = window.setTimeout(()=>{
        const p = battlePending;
        battlePending = null;
        inputLocked = false;
        resolveBattle(p);
      }, 2000);
      return;
    }

    clearSelection();
    render();
    if(checkWin()) return;

    // 다음 턴으로(번갈아 1회씩)
    setTurn(mover.side===HUMAN ? CPU : HUMAN);
    render();
    // 컴퓨터가 말을 움직일 때 1.5초 정도 기다렸다가 움직이도록
    if(turn===CPU) setTimeout(aiTurn, 1500);
  }
  function getSquareEl(pos){
    if(!elBoard || !elBoard.querySelector) return null;
    return elBoard.querySelector(`.sq[data-r="${pos.r}"][data-c="${pos.c}"]`);
  }

  function getPieceEl(pos){
    const sq = getSquareEl(pos);
    return sq ? sq.querySelector('.piece') : null;
  }

  function sparkSquares(a,b,ms=900){
    const sa=getSquareEl(a), sb=getSquareEl(b);
    if(sa) sa.classList.add('sparkle');
    if(sb) sb.classList.add('sparkle');
    window.setTimeout(()=>{ if(sa) sa.classList.remove('sparkle'); if(sb) sb.classList.remove('sparkle'); }, ms);
  }

  // CPU move readability: blink origin/destination then animate the piece travel
  function blinkSquares(a,b,ms=320){
    const sa=getSquareEl(a), sb=getSquareEl(b);
    if(sa) sa.classList.add('cpu-blink');
    if(sb) sb.classList.add('cpu-blink');
    window.setTimeout(()=>{ if(sa) sa.classList.remove('cpu-blink'); if(sb) sb.classList.remove('cpu-blink'); }, ms);
  }

  function animateMove(from,to,duration=520,done){
    const piece = getPieceEl(from);
    const sqFrom = getSquareEl(from);
    const sqTo = getSquareEl(to);
    if(!piece || !sqFrom || !sqTo){
      done && done();
      return;
    }

    const pr = piece.getBoundingClientRect();
    const tr = sqTo.getBoundingClientRect();
    const dx = (tr.left + tr.width/2) - (pr.left + pr.width/2);
    const dy = (tr.top  + tr.height/2) - (pr.top  + pr.height/2);

    const clone = piece.cloneNode(true);
    clone.classList.add('move-clone');
    clone.style.position = 'fixed';
    clone.style.left = pr.left + 'px';
    clone.style.top  = pr.top  + 'px';
    clone.style.width  = pr.width + 'px';
    clone.style.height = pr.height + 'px';
    clone.style.margin = '0';
    clone.style.transform = 'translate(0px, 0px)';
    clone.style.transition = `transform ${duration}ms cubic-bezier(.2,.9,.2,1)`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';

    // hide original during travel
    piece.style.visibility = 'hidden';
    document.body.appendChild(clone);

    // trigger transition
    requestAnimationFrame(()=>{
      clone.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    const cleanup = ()=>{
      clone.removeEventListener('transitionend', cleanup);
      clone.remove();
      piece.style.visibility = '';
      done && done();
    };
    clone.addEventListener('transitionend', cleanup);
    window.setTimeout(cleanup, duration + 80);
  }

  function resolveBattle(p){
    if(!p) return;
    const {from,to,mover,dest,result} = p;
    const moverName = rankById[mover.rankId].name;
    const who = (mover.side===HUMAN) ? 'our' : 'enemy';

    // Visual: sparkle around the clash so players can see where it happened
    sparkSquares(from, to, 900);

    // Visual: fade out the losing piece(s) a bit slower so it's readable
    const fadeMs = 650;
    const loserFrom = (result==='def' || result==='both');
    const loserTo   = (result==='att' || result==='both');

    if(loserFrom){
      const el = getPieceEl(from);
      if(el) el.classList.add('piece-die');
    }
    if(loserTo){
      const el = getPieceEl(to);
      if(el) el.classList.add('piece-die');
    }

    // Optional: slightly emphasize the winner (helps readability)
    if(result==='att'){
      const el = getPieceEl(from);
      if(el) el.classList.add('piece-win');
    } else if(result==='def'){
      const el = getPieceEl(to);
      if(el) el.classList.add('piece-win');
    }

    window.setTimeout(()=>{
      if(result==='att'){
        board[to.r][to.c] = mover;
        board[from.r][from.c] = null;
        } else if(result==='def'){
        board[from.r][from.c] = null;
        } else {
        // 계급이 같을 때: 둘 다 제거
        const aWasPres = mover.rankId==='PRES';
        const dWasPres = dest.rankId==='PRES';
        board[from.r][from.c] = null;
        board[to.r][to.c] = null;
        }

      // Announce important removals (대통령/별잡이)
      const removed = [];
      if(result==='att' || result==='both') removed.push(dest);
      if(result==='def' || result==='both') removed.push(mover);

      const msgs = [];
      for(const rp of removed){
        if(!rp) continue;
        if(rp.rankId==='PRES'){
          msgs.push(`${rp.side===HUMAN ? 'Human' : 'AI'} VIP eliminated`);
        } else if(rp.rankId==='ACC'){
          msgs.push(`${rp.side===HUMAN ? 'Human' : 'AI'} Sniper eliminated`);
        }
      }
      // IMPORTANT: Show each event on its own line (never join into a single horizontal string).
      // This prevents readability issues and avoids accidentally reverting to "A / B" format.
      if(msgs.length){
        for(const m of msgs) announceImportant(m);
      }

      render();
      if(checkWin()) return;
      setTurn(mover.side===HUMAN ? CPU : HUMAN);
      render();
      if(turn===CPU) setTimeout(aiTurn, 1500);
    }, fadeMs);
  }

  // ---------- AI ----------
  function aiTurn(){
    if(gameOver) return;

    // gather all cpu moves
    // IMPORTANT: CPU 대통령은 인간 말을 "절대" 공격(캡처)하지 않는다.
    // - 따라서 대통령이 수행할 수 있는 cap 타입의 움직임은 AI 선택지에서 제외한다.
    // - (대통령의 회피 이동은 별도 로직으로 처리)
    const moves=[];
    for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const p = board[r][c];
      if(!p || p.side!==CPU) continue;
      const targets = getLegalTargets({r,c});
      for(const t of targets){
        // Never allow 대통령 to capture.
        if(p.rankId==='PRES' && t.type==='cap') continue;
        moves.push({from:{r,c}, to:{r:t.r,c:t.c}, type:t.type});
      }
    }

    if(moves.length===0){
      setTurn(HUMAN);
      return;
    }

    // ---- Defensive behavior: if the CPU 대통령 is threatened (a human piece is nearby), it tries to flee.
    // NOTE: This does NOT peek at hidden ranks. It only reacts to proximity on the board.
    // "근처" is interpreted as Manhattan distance <= 2.
    const manhattan = (a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c);
    const humanCoords = [];
    let cpuPresPos = null;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      const p = board[r][c];
      if(!p) continue;
      if(p.side===HUMAN) humanCoords.push({r,c});
      else if(p.side===CPU && p.rankId==='PRES') cpuPresPos = {r,c};
    }

    if(cpuPresPos && humanCoords.length){
      let nearest = Infinity;
      for(const hc of humanCoords) nearest = Math.min(nearest, manhattan(cpuPresPos, hc));

      if(nearest <= 2){
        // Candidate moves for the CPU president that increase distance from the nearest human piece.
        const presMoves = moves.filter(m=>{
          const p = board[m.from.r][m.from.c];
          return p && p.side===CPU && p.rankId==='PRES' && m.type==='move';
        });

        if(presMoves.length){
          // Score by resulting minimum distance to any human piece.
          let bestScore = -1;
          let best = [];
          for(const m of presMoves){
            const after = {r:m.to.r, c:m.to.c};
            let d = Infinity;
            for(const hc of humanCoords) d = Math.min(d, manhattan(after, hc));

            // Prefer moves that actually increase distance.
            if(d < nearest) continue;

            // Small preference: avoid moving "down" (dr=+1) when possible, but fleeing takes priority.
            const dr = m.to.r - m.from.r;
            const score = d * 10 + (dr===1 ? 0 : 1);

            if(score > bestScore){
              bestScore = score;
              best = [m];
            } else if(score === bestScore){
              best.push(m);
            }
          }

          if(best.length){
            // Pick one of the best fleeing moves.
            const pick = best[rand(best.length)];

            // Remember which CPU piece is moving (helps avoid repeating it next turn)
            const _cpuMover = board[pick.from.r][pick.from.c];
            lastCpuMoverUid = _cpuMover ? _cpuMover.uid : null;

            inputLocked = true;
            blinkSquares(pick.from, pick.to, 320);
            window.setTimeout(()=>{
              playMoveSfx(CPU);
              animateMove(pick.from, pick.to, 520, ()=>{
                inputLocked = false;
                setLastMove(pick.from, pick.to, CPU);
                suppressSfxOnce = true;
                doMove(pick.from, pick.to);
              });
            }, 260);
            return;
          }
        }
      }
    }

    // Aggressive objective: prioritize the fastest route to capture the human FLAG (or PRESIDENT if FLAG is already gone).
    const targetPos = findFlag(HUMAN) || findPresident(HUMAN);

    // Shortest path (in steps) for a given piece to reach the target, without peeking at hidden ranks.
    // Rules:
    // - cannot move through CPU pieces
    // - can step into HUMAN pieces as a capture (cost 1)
    // - CPU 대통령 never captures (already filtered from moves), and is blocked by HUMAN pieces in the pathfinder
    function shortestSteps(start, piece){
      if(!targetPos) return 999;
      const INF = 999;
      const dist = Array.from({length:ROWS}, ()=>Array.from({length:COLS}, ()=>INF));
      const q = [];
      dist[start.r][start.c] = 0;
      q.push(start);

      while(q.length){
        const cur = q.shift();
        const cd = dist[cur.r][cur.c];
        if(cur.r===targetPos.r && cur.c===targetPos.c) return cd;

        for(const [dr,dc] of dirs8){
          const nr = cur.r + dr, nc = cur.c + dc;
          if(!inBounds(nr,nc)) continue;

          const to = {r:nr,c:nc};
          if(!isPresidentMoveAllowed(piece, cur, to)) continue;

          // Occupancy (treat the start square as empty for traversal purposes)
          const cell = (nr===start.r && nc===start.c) ? null : board[nr][nc];
          if(cell && cell.side===CPU) continue;

          // 대통령은 캡처 불가: HUMAN 말이 있으면 길이 막힌 것으로 처리
          if(piece.rankId==='PRES' && cell && cell.side===HUMAN) continue;

          const nd = cd + 1;
          if(nd < dist[nr][nc]){
            dist[nr][nc] = nd;
            q.push({r:nr,c:nc});
          }
        }
      }
      return INF;
    }

    function scoreMove(m){
      const att = board[m.from.r][m.from.c];
      if(!att) return -1e9;

      // If the target is missing (rare), keep reasonable behavior.
      const before = shortestSteps(m.from, att);
      const after  = shortestSteps(m.to, att);

      let score = 0;

      // Primary: minimize distance-to-target (fastest route).
      score += (before - after) * 200;     // big reward for making progress
      score += (999 - after) * 2;          // small absolute preference closer to target

      // Prefer captures (more "aggressive")
      if(m.type==='cap') score += 80;

      const def = board[m.to.r][m.to.c];
      if(def && def.side===HUMAN){
        // Winning condition: capture FLAG ASAP
        if(def.rankId==='FLAG') score += 1e8;

        // If CPU knows the target rank (revealed to CPU), avoid losing trades.
        if(def.revealedForCPU){
          const res = battle(att, def);
          if(res==='att') score += 240;       // good capture
          else if(res==='both') score += 120; // trade is acceptable
          else score -= 600;                  // avoid known losing capture
        } else {
          // Unknown: still allow aggressive captures if they advance the route significantly.
          if(after < before) score += 60;
        }
      }

      // Avoid moving the same CPU piece repeatedly if alternatives exist.
      if(lastCpuMoverUid && att.uid === lastCpuMoverUid) score -= 60;

      return score;
    }

    // Pick the move that most aggressively progresses toward the objective.
    let bestScore = -1e18;
    let bestMoves = [];
    for(const m of moves){
      const s = scoreMove(m);
      if(s > bestScore){
        bestScore = s;
        bestMoves = [m];
      } else if(s === bestScore){
        bestMoves.push(m);
      }
    }

    // Fallback (shouldn't happen)
    let pick = bestMoves.length ? bestMoves[rand(bestMoves.length)] : moves[rand(moves.length)];
// Remember which CPU piece is moving (helps avoid repeating it next turn)
    const _cpuMover = board[pick.from.r][pick.from.c];
    lastCpuMoverUid = _cpuMover ? _cpuMover.uid : null;

    // Make CPU moves easier to perceive: blink origin/destination, then animate the piece travel.
    // (Players can already infer their own moves; CPU moves are otherwise hard to track.)
    inputLocked = true;
    blinkSquares(pick.from, pick.to, 320);
    window.setTimeout(()=>{
      playMoveSfx(CPU);
      animateMove(pick.from, pick.to, 520, ()=>{
        inputLocked = false;
        setLastMove(pick.from, pick.to, CPU);
        suppressSfxOnce = true;
        doMove(pick.from, pick.to);
      });
    }, 260);
  }

  // ---------- Start ----------
  newGame();
})(); 
