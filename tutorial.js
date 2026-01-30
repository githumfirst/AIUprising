
(function () {
  const LS_KEY = "tutorial_seen_v2"; // Increment version to force new tutorial

  // DOM Elements
  const overlay = document.getElementById("tutorialOverlay");
  const stage = document.getElementById("tutorialStage");
  const chkDontShow = document.getElementById("chkTutorialDontShow");

  // Removed old references to btnSkip, btnNext which are changing
  // We will dynamically create/bind footer buttons or bind them if they exist.


  // --- Audio ---
  const bgm = new Audio("bgMusic/arirang-indoor.mp3");
  bgm.loop = true;
  bgm.volume = 0.2; // Reduced to 1/2 of previous 0.4

  let muted = false;
  try { if (localStorage.getItem('hva_muted') === '1') muted = true; } catch (e) { }
  bgm.muted = muted;

  const sfxCollision = new Audio("bgMusic/collision.mp3");
  sfxCollision.volume = 0.4;

  if (!overlay || !stage) return;

  // --- Scenario Data ---
  // Commands: { t: 'text', msg: '' } | { t: 'move', from:[r,c], to:[r,c] }, { t: 'wait', ms: 1000 }
  // Commands: { t: 'text', msg: {en:'', ko:''} }
  const SCENARIOS = [
    {
      title: { en: "1. THE HIERARCHY", ko: "1. 계급 체계 (상성)" },
      setup: {
        rows: 4, cols: 4,
        pieces: [
          { r: 3, c: 1, side: 'H', id: 'GEN' }, // Our General
          { r: 0, c: 1, side: 'C', id: 'MG' },  // Enemy Major General (2 Stars)
        ]
      },
      steps: [
        { t: 'text', msg: { en: "Commander! High ranks crush low ranks.", ko: "사령관님! 높은 계급은 낮은 계급을 이깁니다." } },
        { t: 'wait', ms: 100 },
        { t: 'focus', r: 3, c: 1 }, // Highlight General
        { t: 'text', msg: { en: "This is a 4-Star General (Highest).", ko: "이것은 4성 장군(대장)입니다. 가장 높습니다." } },
        { t: 'wait', ms: 300 },
        { t: 'move', from: { r: 3, c: 1 }, to: { r: 2, c: 1 } },
        { t: 'move', from: { r: 0, c: 1 }, to: { r: 1, c: 1 } },
        { t: 'wait', ms: 500 },
        { t: 'text', msg: { en: "The enemy Major General (2 Stars) approaches...", ko: "적군 소장(별 2개)이 다가옵니다..." } },
        { t: 'move', from: { r: 2, c: 1 }, to: { r: 1, c: 1 } }, // Battle
        { t: 'result', winner: 'att', msg: { en: "Victory! Higher rank wins.", ko: "승리! 더 높은 계급이 이깁니다." } },
        { t: 'wait', ms: 1500 }
      ]
    },
    {
      title: { en: "2. The Sniper Threat", ko: "2. 저격수(Sniper)의 위협" },
      setup: {
        rows: 4, cols: 4,
        pieces: [
          { r: 3, c: 2, side: 'H', id: 'GEN' },
          { r: 0, c: 0, side: 'C', id: 'ACC' }, // Sniper
        ]
      },
      steps: [
        { t: 'text', msg: { en: "But beware the Sniper!", ko: "하지만 저격수를 조심하세요!" } },
        { t: 'move', from: { r: 3, c: 2 }, to: { r: 2, c: 1 } },
        { t: 'text', msg: { en: "Even a General isn't safe.", ko: "장군도 안전하지 않습니다." } },
        { t: 'move', from: { r: 0, c: 0 }, to: { r: 1, c: 0 } },
        { t: 'wait', ms: 500 },
        { t: 'move', from: { r: 2, c: 1 }, to: { r: 1, c: 1 } },
        { t: 'text', msg: { en: "Approaching...", ko: "접근 중..." } },
        { t: 'wait', ms: 500 },
        { t: 'move', from: { r: 1, c: 0 }, to: { r: 1, c: 1 } }, // Sniper attacks General
        { t: 'result', winner: 'att', msg: { en: "DEFEAT! Sniper kills all Stars.", ko: "패배! 저격수는 모든 장군(별)을 잡습니다." } },
        { t: 'wait', ms: 2000 }
      ]
    },
    {
      title: { en: "3. MP Radar", ko: "3. 헌병(MP) 레이더" },
      setup: {
        rows: 4, cols: 4,
        pieces: [
          { r: 3, c: 1, side: 'H', id: 'MP' },
          { r: 1, c: 1, side: 'C', id: 'MG' },  // Hidden Enemy
          { r: 0, c: 0, side: 'C', id: 'GEN' }, // Another Hidden Enemy
          { r: 0, c: 3, side: 'C', id: 'SPY' }, // Another Hidden Enemy
        ]
      },
      steps: [
        { t: 'text', msg: { en: "Use Military Police (MP) to scout.", ko: "헌병(MP)을 이용해 정찰하세요." } },
        { t: 'move', from: { r: 3, c: 1 }, to: { r: 2, c: 1 } },
        { t: 'text', msg: { en: "Military Police loses to everyone, BUT...", ko: "헌병은 최약체지만, 전투를 하면..." } },
        { t: 'move', from: { r: 2, c: 1 }, to: { r: 1, c: 1 } }, // MP hits Enemy
        { t: 'radar', msg: { en: "RADAR ACTIVATED!", ko: "레이더 발동!" } }, // Special effect
        { t: 'result', winner: 'def', msg: { en: "Military Police died, but revealed ALL enemies for 10s!", ko: "헌병은 전사했지만, 10초간 적의 정체를 밝힙니다!" } },
        { t: 'wait', ms: 2500 }
      ]
    },
    {
      title: { en: "4. Protect the President", ko: "4. 대통령 경호" },
      setup: {
        rows: 4, cols: 4,
        pieces: [
          { r: 2, c: 2, side: 'H', id: 'PRES' },
          { r: 0, c: 2, side: 'C', id: 'COL' }, // Colonel (3 Flowers)
          { r: 0, c: 1, side: 'C', id: 'LTC' }, // Lt. Colonel (2 Flowers)
        ]
      },
      steps: [
        { t: 'text', msg: { en: "The President (PRES) is weak.", ko: "대통령(PRES)은 전투력이 없습니다." } },
        { t: 'move', from: { r: 0, c: 2 }, to: { r: 1, c: 2 } },
        { t: 'text', msg: { en: "He dies to ANYONE.", ko: "누구에게나 잡힙니다." } },
        { t: 'move', from: { r: 2, c: 2 }, to: { r: 2, c: 3 } }, // Run away!
        { t: 'text', msg: { en: "Run away!", ko: "도망치세요!" } },
        { t: 'move', from: { r: 0, c: 1 }, to: { r: 1, c: 1 } }, // Avoiding collision with COL at 1,2
        { t: 'move', from: { r: 2, c: 3 }, to: { r: 3, c: 2 } },
        { t: 'text', msg: { en: "Survive to win.", ko: "살아남아야 이깁니다." } },
        { t: 'wait', ms: 1500 }
      ]
    }
  ];

  // --- Engine State ---
  let curScenarioIdx = 0;
  let curStepIdx = 0;
  let scenarioTimer = null;
  let miniBoard = []; // 2D array
  let boardRows = 4, boardCols = 4;

  // --- Helper: Render Piece (reusing logic from game.js visually) ---
  // Since we can't easily import game.js, we duplicate the minimal visual logic or use CSS classes.
  function renderPieceHTML(side, id, visible = true) {
    // Mappings
    const isHuman = (side === 'H');
    const colorClass = isHuman ? 'p-h' : 'p-c';
    let content = '';

    // Simple Icon Mapping for Tutorial
    const icons = {
      'GEN': '⭐⭐⭐⭐',
      'LTG': '⭐⭐⭐',
      'MG': '⭐⭐',
      'BG': '⭐',
      'COL': '✿✿✿',
      'LTC': '✿✿',
      'ACC': `<div class="insIcon" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 100 50" fill="currentColor" style="width:100%; height:100%; color:#e2e8f0; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
          <!-- Stock and Body -->
          <path d="M5,30 L15,30 L20,25 L35,25 L35,22 L15,22 Z M35,22 L60,22 L60,28 L40,28 L40,32 L35,32 Z" fill="#cbd5e1"/>
          <!-- Barrel -->
          <path d="M60,23 L90,23 L90,26 L60,26 Z" fill="#94a3b8"/>
          <!-- Muzzle Brake -->
          <path d="M90,22 L95,22 L95,27 L90,27 Z" fill="#64748b"/>
          <!-- Scope -->
          <path d="M40,18 L70,18 L70,14 L40,14 Z M35,16 L40,16 M70,16 L75,16" stroke="#475569" stroke-width="2"/>
          <rect x="42" y="19" width="4" height="3" fill="#475569"/>
          <rect x="64" y="19" width="4" height="3" fill="#475569"/>
          <!-- Bipod -->
          <path d="M75,27 L70,35 M75,27 L80,35" stroke="#475569" stroke-width="1.5"/>
        </svg>
      </div>`,
      'PRES': 'PRES',
      'MP': 'MP',
      'E2': '<div class="insStripes"><span class="bar"></span></div>',
      'E1': '<div class="insStripes"><span class="bar"></span><span class="bar"></span></div>',
    };

    // For AI, show "Devil" if hidden, else show Icon
    if (!isHuman && !visible) {
      content = '<div class="insEnemy">😈</div>';
    } else {
      const icon = icons[id] || id;
      const label = (id === 'ACC') ? 'Sniper' : id;
      content = `<div class="insigniaWrap">${icon}</div><div class="small">${label}</div>`;
    }

    return `<div class="piece ${colorClass} ${id === 'PRES' ? 'rank-pres' : ''} ${id === 'MP' ? 'rank-mp' : ''}">${content}</div>`;
  }

  function initScenario(idx) {
    if (idx >= SCENARIOS.length) {
      // End of tutorial
      closeTutorial(true);
      return;
    }
    const scen = SCENARIOS[idx];

    boardRows = scen.setup.rows;
    boardCols = scen.setup.cols;

    // Init Board
    miniBoard = Array.from({ length: boardRows }, () => Array(boardCols).fill(null));
    scen.setup.pieces.forEach(p => {
      // User Request: Reveal AI ranks in tutorial so players understand the hierarchy logic.
      miniBoard[p.r][p.c] = { ...p, visible: true };
    });

    // Render Frame
    const lang = window.gameLang || 'en';
    const titleText = (typeof scen.title === 'object') ? (scen.title[lang] || scen.title.en) : scen.title;

    // Button Logic (Flexbox aligned)
    const btnHtml = `<button id="btnTutLang" class="btnLangToggle" style="
      z-index: 100;
      height: 28px;
      min-width: 60px;
      padding: 0 12px;
      font-size: 0.8rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      color: white;
      border-radius: 14px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      margin-left: auto;
    ">${window.gameLang === 'en' ? '한국어' : 'EN'}</button>`;

    // Header Flex Container
    const headerHtml = `<div class="tutHeaderRow" style="display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:15px; min-height:32px;">
      <div class="tutScenarioTitle" style="margin:0; flex:1; text-align:center;">${titleText}</div>
      ${btnHtml}
    </div>`;

    const boardHtml = `<div class="tutBoard" style="grid-template-columns:repeat(${boardCols}, 1fr); grid-template-rows:repeat(${boardRows}, 1fr);"></div>`;
    const msgHtml = `<div class="tutMsg">...</div>`;

    stage.innerHTML = `<div class="tutScenarioWrap">${headerHtml}${boardHtml}${msgHtml}</div>`;

    // Bind Button
    setTimeout(() => {
      const btn = stage.querySelector('#btnTutLang');
      if (btn && window.setGameLanguage) {
        btn.onclick = (e) => {
          e.stopPropagation();
          const next = (window.gameLang === 'en' ? 'ko' : 'en');
          window.setGameLanguage(next);
        };
      }
    }, 0);

    renderBoard();

    curStepIdx = 0;
    runStep(scen);
  }

  // --- I18N Helper ---
  function getMsg(obj) {
    if (typeof obj === 'string') return obj;
    const lang = window.gameLang || 'en';
    return obj[lang] || obj.en;
  }

  // Exposed updater
  window.updateTutorialLanguage = function () {
    if (!overlay.classList.contains("isOpen")) return; // Only update if open

    // Update Title
    if (curScenarioIdx < SCENARIOS.length) {
      const scen = SCENARIOS[curScenarioIdx];
      const titleEl = stage.querySelector('.tutScenarioTitle');
      if (titleEl) titleEl.innerText = getMsg(scen.title);

      // Update Current Message (if text step)
      // Note: runStep advances automatically, so simply updating the DOM might be enough
      // But if the message is in the middle of waiting, we just update the text content.
      const msgEl = stage.querySelector('.tutMsg');
      if (msgEl && currentMsgObject) {
        msgEl.innerHTML = getMsg(currentMsgObject);
      }
    }
  };

  let currentMsgObject = null; // Store reference to current message object for re-translation

  function renderBoard() {
    const boardEl = stage.querySelector('.tutBoard');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < boardRows; r++) {
      for (let c = 0; c < boardCols; c++) {
        const sq = document.createElement('div');
        sq.className = `sq ${((r + c) % 2 === 0) ? 'light' : 'dark'}`;
        sq.dataset.r = r;
        sq.dataset.c = c;

        const p = miniBoard[r][c];
        if (p) {
          const div = document.createElement('div');
          div.innerHTML = renderPieceHTML(p.side, p.id, p.visible);
          // Extract inner piece
          const pieceNode = div.firstElementChild;
          sq.appendChild(pieceNode);

          // Animation hook
          p._el = pieceNode;
        }
        boardEl.appendChild(sq);
      }
    }
  }

  function runStep(scen) {
    // Determine if we are at the end of the scenario
    if (curStepIdx >= scen.steps.length) {
      // SCENARIO FINISHED.

      // If this was the last scenario, show Final Buttons
      if (curScenarioIdx >= SCENARIOS.length - 1) {
        showFinalControls();
      } else {
        // Otherwise, Auto-advance to next scenario after 0.3 seconds
        scenarioTimer = setTimeout(() => {
          curScenarioIdx++;
          initScenario(curScenarioIdx);
        }, 300);
      }
      return;
    }

    // ... existing step execution ...
    const step = scen.steps[curStepIdx];
    curStepIdx++;

    const msgEl = stage.querySelector('.tutMsg');

    if (step.t === 'text') {
      currentMsgObject = step.msg; // Save for language toggle
      const text = getMsg(step.msg);

      msgEl.innerHTML = text; // Use innerHTML to support styling
      msgEl.classList.add('pop');
      setTimeout(() => msgEl.classList.remove('pop'), 200);

      // Auto-read time based on length, min 1.5s
      const readTime = Math.max(1500, text.length * 50);
      scenarioTimer = setTimeout(() => runStep(scen), readTime);
    }
    else if (step.t === 'wait') {
      scenarioTimer = setTimeout(() => runStep(scen), step.ms);
    }
    else if (step.t === 'focus') {
      // Highlight effect (optional)
      runStep(scen);
    }
    else if (step.t === 'move') {
      // Animate Move
      const p = miniBoard[step.from.r][step.from.c];
      const target = miniBoard[step.to.r][step.to.c]; // Check if occupied (Capture)
      if (!p) { runStep(scen); return; }

      // Find DOM
      const sqFrom = stage.querySelector(`.sq[data-r="${step.from.r}"][data-c="${step.from.c}"]`);
      const sqTo = stage.querySelector(`.sq[data-r="${step.to.r}"][data-c="${step.to.c}"]`);

      if (p._el && sqFrom && sqTo) {
        // Calculate delta
        const r1 = sqFrom.getBoundingClientRect();
        const r2 = sqTo.getBoundingClientRect();
        const dx = r2.left - r1.left;
        const dy = r2.top - r1.top;

        p._el.style.transform = `translate(${dx}px, ${dy}px)`;
        p._el.style.transition = 'transform 0.4s ease-in-out';
        p._el.style.zIndex = 10;

        setTimeout(() => {
          // Logic Update
          if (target) {
            // Boom Visual
            showBoom(step.to.r, step.to.c);
            // Boom Audio
            // Reset and play collision SFX if not muted
            if (!muted) {
              sfxCollision.currentTime = 0;
              sfxCollision.play().catch(() => { });
            }
          }

          miniBoard[step.from.r][step.from.c] = null;
          miniBoard[step.to.r][step.to.c] = p;
          p._el.style.transform = '';
          p._el.style.zIndex = '';
          renderBoard(); // Snap to grid
          runStep(scen);
        }, 450);
      } else {
        renderBoard();
        runStep(scen);
      }
    }
    else if (step.t === 'result') {
      currentMsgObject = step.msg;
      const text = getMsg(step.msg);
      msgEl.innerHTML = `<span style="color:${step.winner === 'att' || step.winner === 'def' ? '#ffcc66' : '#fff'}">${text}</span>`;
      // Wait a bit for result to be read
      scenarioTimer = setTimeout(() => runStep(scen), 2500);
    }
    else if (step.t === 'radar') {
      currentMsgObject = step.msg;
      const text = getMsg(step.msg);
      msgEl.innerHTML = `<b style="color:#f66">${text}</b>`;
      miniBoard.forEach(row => row.forEach(p => {
        if (p && p.side === 'C') p.visible = true;
      }));
      renderBoard();
      const radars = stage.querySelectorAll('.p-c');
      radars.forEach(el => el.style.boxShadow = '0 0 15px #f00');
      scenarioTimer = setTimeout(() => runStep(scen), 2500);
    }
  }

  // No-op for showFinalControls as controls are permanent now.
  function showFinalControls() {
    // Just update the message
    const msgEl = stage.querySelector('.tutMsg');
    if (msgEl) msgEl.innerHTML = "<span style='color:#3ddc97'>Ready to Command?</span>";
  }

  // --- Audio / FX Helpers ---
  // playExplosion removed in favor of sfxCollision file

  function showBoom(r, c) {
    // Find the square on the DOM to get absolute position
    const sq = stage.querySelector(`.sq[data-r="${r}"][data-c="${c}"]`);
    if (!sq) return;

    // Get screen coordinates
    const rect = sq.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const boom = document.createElement('div');
    boom.className = 'tutBoom';
    // Force fixed position to escape any overflow clipping
    boom.style.position = 'fixed';
    boom.style.left = cx + 'px';
    boom.style.top = cy + 'px';
    boom.style.zIndex = '100000'; // Ensure it's on top of everything

    // Use the generated image for the visual (Black background)
    const img = document.createElement('img');
    img.src = 'crazygameuploadData/bang.png';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    // Use blend mode to make black transparent
    boom.style.mixBlendMode = 'screen';
    boom.appendChild(img);

    // Add random rotation for variety
    const rot = Math.random() * 30 - 15;
    boom.style.setProperty('--rot', rot + 'deg');

    document.body.appendChild(boom);

    setTimeout(() => boom.remove(), 1300);
  }

  // --- Main Controls ---
  function openTutorial() {
    overlay.classList.add("isOpen");
    overlay.setAttribute("aria-hidden", "false");

    // Sync mute state from storage on open
    try { muted = (localStorage.getItem('hva_muted') === '1'); } catch (e) { }

    // Pause the underlying game if active
    if (window.pauseGame) window.pauseGame();

    // Play BGM
    bgm.currentTime = 0;
    bgm.muted = muted; // Ensure sync on open
    if (!muted) {
      bgm.play().catch(() => {
        // Handle autoplay block: Show a visual hint
        const hint = document.createElement('div');
        hint.className = 'tutAudioHint';
        hint.style.position = 'absolute';
        hint.style.top = '50%';
        hint.style.left = '50%';
        hint.style.transform = 'translate(-50%, -50%)';
        hint.style.background = 'rgba(0,0,0,0.7)';
        hint.style.color = '#fff';
        hint.style.padding = '15px 25px';
        hint.style.borderRadius = '30px';
        hint.style.fontSize = '1.2em';
        hint.style.fontWeight = 'bold';
        hint.style.pointerEvents = 'none'; // click-through to document
        hint.style.zIndex = '999999';
        hint.style.border = '2px solid rgba(255,255,255,0.3)';
        hint.style.backdropFilter = 'blur(4px)';
        hint.style.animation = 'pulse 1.5s infinite';
        hint.innerHTML = '🔊 Click anywhere to enable sound';
        document.body.appendChild(hint);

        const unlock = () => {
          if (!muted) bgm.play().catch(() => { });
          if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
          document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock);
      });
    }

    // Mute button REMOVED per user request. 
    // Tutorial now syncs mute state from main game automatically at start.

    // Set Footer with Replay / Start Game + Checkbox
    const footer = document.querySelector('.tutorialFooter');
    if (footer) {
      // Re-create footer content to ensure specific buttons exist
      // Layout: [Don't Show] [Replay] [Start Game]
      // Or if following image 2: [Replay] [Start Game], where is Checkbox?
      // I will put Checkbox on left, and Buttons on right.
      footer.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <button id="btnTutReplay" class="tutBtn sec" style="padding:8px 16px; border:1px solid #444; background:#222; color:#ccc; border-radius:6px; cursor:pointer;">Replay</button>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <label class="tutorialCheck" style="margin-right:10px;">
                    <input id="chkTutorialDontShow" type="checkbox" ${chkDontShow && chkDontShow.checked ? 'checked' : ''}> Don't show again
                </label>
                <button id="btnTutStart" class="tutBtn pri" style="padding:8px 16px; background:#3ddc97; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Start Game</button>
            </div>
        `;

      const bReplay = document.getElementById('btnTutReplay');
      const bStart = document.getElementById('btnTutStart');
      const chk = document.getElementById('chkTutorialDontShow');

      if (bReplay) bReplay.addEventListener('click', () => {
        curScenarioIdx = 0;
        initScenario(0);
      });

      if (bStart) bStart.addEventListener('click', () => closeTutorial(chk.checked));

      if (chk) chk.addEventListener('change', (e) => {
        if (chkDontShow) chkDontShow.checked = e.target.checked;
      });
    }

    // Reset
    curScenarioIdx = 0;
    initScenario(0);
  }

  function closeTutorial(markSeen) {
    clearTimeout(scenarioTimer);
    overlay.classList.remove("isOpen");
    overlay.setAttribute("aria-hidden", "true");

    bgm.pause();

    if (markSeen) {
      try { localStorage.setItem(LS_KEY, "1"); } catch (_) { }
    }
    // Start game if on title
    if (window.isGameActive && window.isGameActive()) {
      if (window.resumeGame) window.resumeGame();
    } else {
      if (window.startGame) window.startGame();
    }
  }


  // Init
  window.openTutorial = openTutorial;

  // Auto-open logic - MOVED TO game.js to support Landing Screen
  // let seen = false;
  // try { seen = localStorage.getItem(LS_KEY) === "1"; } catch (_) { }
  // if (!seen) window.addEventListener("DOMContentLoaded", openTutorial);

  // Hook existing button
  const btnLaunch = document.getElementById("btnTutorial");
  if (btnLaunch) btnLaunch.addEventListener("click", openTutorial);

  console.log("Tutorial Script Loaded Successfully");

})();
