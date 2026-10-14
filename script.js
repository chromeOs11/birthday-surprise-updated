  
/* ==========================================================
   BIRTHDAY SURPRISE — CONFIGURATION
   ========================================================== */

const CONFIG = {
  recipientName: "Kanishka",
  pin: "1410",

  story: [
    {
      title: "Some people make<br>ordinary days <em>glow.</em>",
      text: "They turn small moments into the ones you remember. This little world is made of those moments — and a few new ones still waiting to happen."
    },
    {
      title: "May good things<br>find their way <em>to you.</em>",
      text: "May there always be a song that fits your mood, a place where you feel at home, and someone who makes even a quiet day feel special."
    },
    {
      title: "The best is still<br>being <em>written.</em>",
      text: "Your story has so many pages left. I hope the next ones bring brave choices, unexpected laughter, and memories you will want to revisit."
    }
  ],


letter: [
  "Hey there, I hope you know how special this little moment is meant to be. Somewhere between all the ordinary days, little conversations, unexpected smiles, and memories we collect without even realizing it, some people become a little more meaningful than words can explain. And today, I just wanted to leave you something that might make you smile, even if only for a moment.",
  
  "As you step into another chapter of your life, I hope you find happiness in the smallest things, courage when life feels uncertain, and peace in the moments when you need it most. I hope the dreams you keep quietly in your heart find their way into reality, that you meet people who appreciate the real you, and that you never feel like you have to change who you are to deserve something beautiful. You deserve days that feel lighter, laughter that comes naturally, and memories that make you smile long after they have passed.",
  
  "And if there is one little wish I could leave between these lines, it would be this: may life surprise you in the loveliest ways. May the things meant for you find you at the right time, may the difficult days teach you without taking away your softness, and may you always have a reason to believe that something wonderful is still ahead. No matter how much changes with time, I hope you keep a little sparkle in your heart and never forget how much beauty there is in simply being yourself."
],


  soundEnabled: false
};


/* ==========================================================
   HELPERS AND STATE
   ========================================================== */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const sceneIds = [
  "intro",
  "giftScene",
  "vaultScene",
  "birthdayScene",
  "storyScene",
  "memoriesScene",
  "gamesScene",
  "letterScene",
  "finalScene"
];

let currentScene = 0;
let pin = "";
let soundOn = false;
let audioContext = null;

let balloonScore = 0;
let balloonTimer = null;
let balloonsRunning = false;

let selectedPhotos = [];
let storyIndex = 0;
let openedCards = [];
let matchedCards = new Set();
let memoryLocked = false;
let secretFound = false;

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;


/* ==========================================================
   SCENE NAVIGATION — CORRECTED
   ========================================================== */

function goTo(id) {
  const next = sceneIds.indexOf(id);

  if (next < 0) return;

  const old = $("#experience .scene.active");
  const target = document.getElementById(id);

  if (!target) return;

  // Do nothing when the requested scene is already active.
  if (old && old.id === id) return;

  // Activate the destination scene.
  target.classList.remove("leaving");
  target.classList.add("active");

  currentScene = next;

  // Update chapter indicators.
  $("#chapterLabel").textContent =
    `CHAPTER ${String(next + 1).padStart(2, "0")} / ${String(sceneIds.length).padStart(2, "0")}`;

  $("#footerChapter").textContent =
    `${String(next + 1).padStart(2, "0")} / ${String(sceneIds.length).padStart(2, "0")}`;

  // Navigate directly to the new scene.
  // This prevents retaining the previous scene's scroll position.
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto"
  });

  // Remove the old scene after its exit animation.
  if (old) {
    old.classList.add("leaving");

    window.setTimeout(() => {
      if (old !== target) {
        old.classList.remove("active", "leaving");
      }
    }, reducedMotion ? 1 : 500);
  }

  // Birthday reveal animation.
  if (id === "birthdayScene") {
    target.classList.remove("curtains-open");

    window.setTimeout(
      () => target.classList.add("curtains-open"),
      reducedMotion ? 1 : 1400
    );

    window.setTimeout(
      launchConfetti,
      reducedMotion ? 1 : 1250
    );
  }

  if (id === "gamesScene") {
    setupMemoryGame();
  }

  if (id === "finalScene") {
    launchConfetti(70);
  }
}


/* ==========================================================
   TOAST NOTIFICATIONS
   ========================================================== */

function toast(message) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2400);
}


/* ==========================================================
   SOUND EFFECTS
   ========================================================== */

function playTone(
  freq = 440,
  duration = 0.12,
  type = "sine",
  volume = 0.035
) {
  if (!soundOn) return;

  try {
    audioContext ||= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(
      volume,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Sound is optional; the website remains usable.
  }
}

$("#soundToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  CONFIG.soundEnabled = soundOn;

  $("#soundToggle").textContent = soundOn ? "♫" : "♪";

  $("#soundToggle").classList.toggle(
    "sound-on",
    soundOn
  );

  if (soundOn) {
    playTone(660, 0.15);
    toast("Sound effects on");
  } else {
    toast("Sound effects off");
  }
});


/* ==========================================================
   INTRO AND GIFT
   ========================================================== */

$("#beginBtn").addEventListener("click", () => {
  playTone(520);
  goTo("giftScene");
});

$("#giftButton").addEventListener("click", () => {
  const gift = $("#giftButton");

  if (gift.classList.contains("opened")) return;

  gift.classList.add("opened");

  $("#giftCaption").textContent =
    "A LITTLE MAGIC, JUST FOR YOU";

  playTone(390, 0.2, "triangle");

  setTimeout(() => {
    playTone(590, 0.28, "sine");
  }, 160);

  setTimeout(() => {
    $("#giftContinue").hidden = false;
  }, reducedMotion ? 20 : 850);
});

$("#giftContinue").addEventListener("click", () => {
  pin = "";
  updatePin();
  goTo("vaultScene");
});


/* ==========================================================
   SECRET PIN VAULT
   ========================================================== */

function updatePin() {
  $$("#pinDots span").forEach((dot, index) => {
    dot.classList.toggle("filled", index < pin.length);
  });
}

function pinError(message = "Not quite. Try again.") {
  const feedback = $("#pinFeedback");

  feedback.textContent = message;
  feedback.classList.remove("error");

  void feedback.offsetWidth;

  feedback.classList.add("error");

  playTone(180, 0.18, "square", 0.02);

  $("#vaultCard").classList.remove("unlocking");
}

$("#keypad").addEventListener("click", event => {
  const button = event.target.closest("button[data-key]");

  if (!button) return;

  const key = button.dataset.key;

  button.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(.92)" },
      { transform: "scale(1)" }
    ],
    { duration: 180 }
  );

  if (key === "clear") {
    pin = "";
    $("#pinFeedback").textContent =
      "A hint: a date worth remembering.";

    updatePin();
    return;
  }

  if (key === "back") {
    pin = pin.slice(0, -1);

    updatePin();

    $("#pinFeedback").textContent =
      "One digit at a time.";

    return;
  }

  if (pin.length >= 4) return;

  pin += key;

  updatePin();

  playTone(330 + pin.length * 55, 0.07);

  if (pin.length === 4) {
    if (pin === CONFIG.pin) {
      $("#pinFeedback").textContent =
        "Unlocked. The magic is yours.";

      $("#pinFeedback").classList.remove("error");

      $(".vault-card").classList.add("unlocking");

      playTone(523, 0.18);

      setTimeout(() => {
        playTone(784, 0.3);
      }, 140);

      setTimeout(() => {
        goTo("birthdayScene");
      }, reducedMotion ? 100 : 1050);

    } else {
      pinError("Not quite — take a breath and try again.");

      setTimeout(() => {
        pin = "";
        updatePin();
      }, 450);
    }
  }
});


/* ==========================================================
   CONFETTI EFFECTS
   ========================================================== */

function launchConfetti(count = 90) {
  const layer = $("#confettiLayer");

  if (!layer) return;

  layer.innerHTML = "";

  const colors = [
    "#d9bd79",
    "#f1a7c9",
    "#f7eee8",
    "#b34d6f",
    "#9f7eb8"
  ];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");

    piece.className = "confetti";

    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[i % colors.length];

    piece.style.setProperty(
      "--dur",
      (3 + Math.random() * 4) + "s"
    );

    piece.style.setProperty(
      "--drift",
      (-100 + Math.random() * 200) + "px"
    );

    piece.style.setProperty(
      "--rot",
      Math.random() * 360 + "deg"
    );

    piece.style.animationDelay =
      Math.random() * 1.5 + "s";

    layer.appendChild(piece);
  }

  setTimeout(() => {
    if (layer.isConnected) {
      layer.innerHTML = "";
    }
  }, 8500);
}

$("#celebrateBtn").addEventListener("click", () => {
  playTone(660, 0.15);

  goTo("storyScene");

  renderStory();
});


/* ==========================================================
   STORY SCENES
   ========================================================== */

function renderStory() {
  const story = CONFIG.story[storyIndex];

  $("#storyCount").textContent =
    `A NOTE FOR YOU · ${String(storyIndex + 1).padStart(2, "0")}`;

  $("#storyTitle").innerHTML = story.title;
  $("#storyText").textContent = story.text;

  $("#storyProgress").style.width =
    ((storyIndex + 1) / CONFIG.story.length * 100) + "%";

  $("#storyPrev").disabled = storyIndex === 0;

  $("#storyNext").innerHTML =
    storyIndex === CONFIG.story.length - 1
      ? 'OPEN THE MEMORIES <span>→</span>'
      : 'NEXT LITTLE THING <span>→</span>';
}

$("#storyNext").addEventListener("click", () => {
  if (storyIndex < CONFIG.story.length - 1) {
    storyIndex++;

    renderStory();
    playTone(480, 0.1);
  } else {
    goTo("memoriesScene");
  }
});

$("#storyPrev").addEventListener("click", () => {
  if (storyIndex > 0) {
    storyIndex--;
    renderStory();
  }
});


/* ==========================================================
   PHOTO MEMORIES
   ========================================================== */

$("#photoUpload").addEventListener("change", event => {
  const files = [...event.target.files].filter(file =>
    file.type.startsWith("image/")
  );

  if (!files.length) return;

  const remaining = Math.max(
    0,
    12 - selectedPhotos.length
  );

  files.slice(0, remaining).forEach(file => {
    const url = URL.createObjectURL(file);

    selectedPhotos.push({
      file,
      url,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())
    });
  });

  renderPhotos();

  event.target.value = "";

  if (files.length > remaining) {
    toast("Showing up to 12 photos at a time.");
  }
});

function renderPhotos() {
  const grid = $("#photoGrid");

  grid.innerHTML = "";

  if (!selectedPhotos.length) {
    grid.innerHTML = `
      <div class="empty-memory">
        <span>✧</span>
        <strong>Your memories go here.</strong>
        <small>Choose a few photos to start your scrapbook.</small>
      </div>
    `;

    return;
  }

  selectedPhotos.forEach((photo, index) => {
    const card = document.createElement("div");

    card.className = "photo-card";

    card.style.setProperty(
      "--tilt",
      `${(index % 2 ? 1 : -1) * (index % 3 + 1)}deg`
    );

    const img = document.createElement("img");

    img.src = photo.url;
    img.alt = `Uploaded memory ${index + 1}`;
    img.loading = "lazy";

    const remove = document.createElement("button");

    remove.type = "button";
    remove.textContent = "×";

    remove.setAttribute(
      "aria-label",
      `Remove photo ${index + 1}`
    );

    remove.addEventListener("click", () => {
      URL.revokeObjectURL(photo.url);

      selectedPhotos = selectedPhotos.filter(
        item => item.id !== photo.id
      );

      renderPhotos();
    });

    card.append(img, remove);
    grid.append(card);
  });
}

$("#clearPhotos").addEventListener("click", () => {
  selectedPhotos.forEach(photo => {
    URL.revokeObjectURL(photo.url);
  });

  selectedPhotos = [];

  renderPhotos();
});

$("#memoriesContinue").addEventListener("click", () => {
  goTo("gamesScene");
});


/* ==========================================================
   MINI-GAME TABS
   ========================================================== */

$$(".game-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".game-tab").forEach(item => {
      item.classList.toggle("selected", item === tab);
    });

    ["balloon", "memory", "secret"].forEach(name => {
      $("#" + name + "Game").hidden =
        tab.dataset.game !== name;
    });

    playTone(400, 0.08);
  });
});


/* ==========================================================
   BALLOON GAME
   ========================================================== */

$("#startBalloons").addEventListener(
  "click",
  startBalloons
);

function startBalloons() {
  if (balloonsRunning) return;

  balloonsRunning = true;
  balloonScore = 0;

  updateBalloonScore();

  const field = $("#balloonField");

  field.innerHTML = "";

  $("#balloonFeedback").textContent =
    "Pop 8 balloons to unlock your reward.";

  clearInterval(balloonTimer);

  balloonTimer = setInterval(() => {
    if (!balloonsRunning) return;

    if (balloonScore >= 8) {
      finishBalloons();
      return;
    }

    const balloon = document.createElement("button");

    balloon.className = "balloon";
    balloon.type = "button";

    balloon.setAttribute("aria-label", "Pop balloon");

    const colors = [
      "#a83e68",
      "#d5a95e",
      "#9b78b5",
      "#d96f8d",
      "#8f536d"
    ];

    balloon.style.setProperty(
      "--balloon",
      colors[Math.floor(Math.random() * colors.length)]
    );

    balloon.style.left =
      (4 + Math.random() * 88) + "%";

    balloon.style.setProperty(
      "--rise",
      (4.5 + Math.random() * 2.5) + "s"
    );

    balloon.style.setProperty(
      "--drift",
      (-45 + Math.random() * 90) + "px"
    );

    balloon.addEventListener("click", () => {
      if (balloon.classList.contains("pop")) return;

      balloon.classList.add("pop");

      balloonScore++;

      updateBalloonScore();

      playTone(
        520 + balloonScore * 35,
        0.08,
        "sine"
      );

      setTimeout(() => balloon.remove(), 250);

      if (balloonScore >= 8) {
        finishBalloons();
      }
    });

    field.appendChild(balloon);

    setTimeout(() => balloon.remove(), 7600);
  }, 500);
}

function updateBalloonScore() {
  $("#balloonScore").textContent =
    `${balloonScore} / 8`;
}

function finishBalloons() {
  balloonsRunning = false;

  clearInterval(balloonTimer);
  balloonTimer = null;

  $("#balloonFeedback").textContent =
    "You did it! A little happiness, collected.";

  $("#balloonField")
    .querySelectorAll(".balloon")
    .forEach(balloon => balloon.remove());

  toast("Balloon challenge complete! ✦");

  launchConfetti(35);
  playTone(784, 0.25);

  $("#balloonField").innerHTML = `
    <div class="game-start">
      <span>✦</span>
      <p>You caught a little joy.</p>
      <button class="primary-button" id="balloonAgain">
        PLAY AGAIN <span>↻</span>
      </button>
    </div>
  `;

  $("#balloonAgain").addEventListener("click", () => {
    balloonsRunning = false;
    startBalloons();
  });
}


/* ==========================================================
   MEMORY MATCH GAME
   ========================================================== */

const symbols = [
  "✦", "☾", "♡", "✧", "♧", "❋",
  "✦", "☾", "♡", "✧", "♧", "❋"
];

function setupMemoryGame() {
  if ($("#memoryBoard").children.length) return;

  const shuffled = [...symbols].sort(
    () => Math.random() - 0.5
  );

  const board = $("#memoryBoard");

  board.innerHTML = "";

  shuffled.forEach((symbol, index) => {
    const button = document.createElement("button");

    button.className = "memory-card";
    button.type = "button";
    button.textContent = "✧";

    button.dataset.symbol = symbol;
    button.dataset.index = index;

    button.setAttribute(
      "aria-label",
      "Hidden memory card"
    );

    button.addEventListener("click", () => {
      flipMemoryCard(button);
    });

    board.appendChild(button);
  });
}

function flipMemoryCard(card) {
  if (
    memoryLocked ||
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  card.classList.add("flipped");
  card.textContent = card.dataset.symbol;

  openedCards.push(card);

  playTone(400, 0.07);

  if (openedCards.length !== 2) return;

  memoryLocked = true;

  const [first, second] = openedCards;

  if (first.dataset.symbol === second.dataset.symbol) {
    first.classList.add("matched");
    second.classList.add("matched");

    matchedCards.add(first.dataset.index);
    matchedCards.add(second.dataset.index);

    $("#matchScore").textContent =
      `${matchedCards.size / 2} / 6`;

    openedCards = [];
    memoryLocked = false;

    if (matchedCards.size === 12) {
      $("#memoryFeedback").textContent =
        "Every pair found. Your memory is magic.";

      launchConfetti(25);
      toast("Memory match complete!");
      playTone(784, 0.25);
    }
  } else {
    setTimeout(() => {
      first.classList.remove("flipped");
      second.classList.remove("flipped");

      first.textContent = "✧";
      second.textContent = "✧";

      openedCards = [];
      memoryLocked = false;
    }, 750);
  }
}

$("#resetMemory").addEventListener("click", () => {
  openedCards = [];
  matchedCards = new Set();
  memoryLocked = false;

  $("#matchScore").textContent = "0 / 6";

  $("#memoryFeedback").textContent =
    "Trust your memory.";

  $("#memoryBoard").innerHTML = "";

  setupMemoryGame();
});


/* ==========================================================
   FIND THE STAR GAME
   ========================================================== */

$("#secretOptions").addEventListener("click", event => {
  const button = event.target.closest(
    "button[data-secret]"
  );

  if (!button || secretFound) return;

  secretFound = true;

  button.classList.add("found");
  button.textContent = "✦";

  $("#secretFeedback").textContent =
    "You found it: may the year ahead surprise you in the loveliest ways.";

  $$("#secretOptions button").forEach(item => {
    item.disabled = true;

    if (item !== button) {
      item.textContent = "·";
    }
  });

  launchConfetti(22);
  playTone(740, 0.22);

  toast("Secret discovered!");
});


/* ==========================================================
   LETTER
   ========================================================== */

$("#gamesContinue").addEventListener("click", () => {
  goTo("letterScene");
});

let letterTypingTimer = null;
let letterWritingStarted = false;

function writeLetter() {
  const message = $("#letterMessage");

  if (!message || letterWritingStarted) return;

  letterWritingStarted = true;
  message.innerHTML = "";

  const paragraphs = CONFIG.letter;
  let paragraphIndex = 0;
  let characterIndex = 0;

  const currentParagraph = document.createElement("p");
  message.appendChild(currentParagraph);

  function typeNextCharacter() {
    if (paragraphIndex >= paragraphs.length) {
      letterTypingTimer = null;
      return;
    }

    const text = paragraphs[paragraphIndex];

    if (characterIndex < text.length) {
      currentParagraph.textContent += text[characterIndex];
      characterIndex++;

      letterTypingTimer = setTimeout(
        typeNextCharacter,
        reducedMotion ? 0 : 24
      );

      return;
    }

    paragraphIndex++;
    characterIndex = 0;

    if (paragraphIndex < paragraphs.length) {
      const nextParagraph = document.createElement("p");

      if (paragraphIndex === paragraphs.length - 1) {
        nextParagraph.classList.add("letter-signoff");
      }

      message.appendChild(nextParagraph);

      // A short pause before the next paragraph begins.
      letterTypingTimer = setTimeout(
        () => {
          currentParagraph = nextParagraph;
          typeNextCharacter();
        },
        reducedMotion ? 0 : 550
      );
    } else {
      letterTypingTimer = null;
    }
  }

  typeNextCharacter();
}


function openLetter() {
  const stage = $("#envelopeStage");

  if (stage.classList.contains("open")) return;

  stage.classList.add("open");

  playTone(500, 0.14);

  setTimeout(() => {
    $("#letterPaper").classList.add("open");

    setTimeout(
      writeLetter,
      reducedMotion ? 0 : 900
    );
  }, reducedMotion ? 1 : 550);
}


$("#envelopeStage").addEventListener("click", openLetter);

$("#envelopeStage").addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openLetter();
  }
});

$("#letterContinue").addEventListener("click", () => {
  goTo("finalScene");
});


/* ==========================================================
   RESTART EXPERIENCE
   ========================================================== */

$("#restartBtn").addEventListener("click", () => {
  clearTimeout(letterTypingTimer);
letterTypingTimer = null;
letterWritingStarted = false;
$("#letterMessage").innerHTML = "";
  clearInterval(balloonTimer);

  balloonTimer = null;
  balloonsRunning = false;

  pin = "";
  storyIndex = 0;
  balloonScore = 0;

  $("#giftButton").classList.remove("opened");

  $("#giftContinue").hidden = true;

  $("#giftCaption").textContent =
    "A SMALL BOX. A BIG FEELING.";

  $(".vault-card").classList.remove("unlocking");

  $("#pinFeedback").textContent =
    "A hint: a date worth remembering.";

  $("#envelopeStage").classList.remove("open");
  $("#letterPaper").classList.remove("open");

  $("#memoryBoard").innerHTML = "";

  openedCards = [];
  matchedCards = new Set();
  memoryLocked = false;

  $("#matchScore").textContent = "0 / 6";

  secretFound = false;

  $("#secretFeedback").textContent =
    "One of these is holding a little wish for you.";

  $$("#secretOptions button").forEach(button => {
    button.disabled = false;
    button.textContent = "☾";
    button.classList.remove("found");
  });

  $("#balloonScore").textContent = "0 / 8";

  $("#balloonFeedback").textContent =
    "Every tap brings you closer.";

  $("#balloonField").innerHTML = `
    <div class="game-start">
      <span>✧</span>
      <p>Ready when you are.</p>
      <button class="primary-button" id="startBalloons">
        START PLAYING <span>→</span>
      </button>
    </div>
  `;

  $("#startBalloons").addEventListener(
    "click",
    startBalloons
  );

  $$(".game-tab").forEach(tab => {
    tab.classList.toggle(
      "selected",
      tab.dataset.game === "balloons"
    );
  });

  $("#balloonGame").hidden = false;
  $("#memoryGame").hidden = true;
  $("#secretGame").hidden = true;

  updatePin();
  renderStory();

  goTo("intro");

  toast("Your little universe is ready again.");
});


/* ==========================================================
   PERSONALIZATION
   ========================================================== */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function applyPersonalization() {
  $("#birthdayTitle").innerHTML =
    `Dear <em>${escapeHtml(CONFIG.recipientName)}</em>,<br>this day is yours.`;

  $("#letterTitle").innerHTML =
  `Hey there<em>,</em>`;

  
$("#letterMessage").innerHTML = "";


  renderStory();
}

applyPersonalization();
updatePin();


/* ==========================================================
   AMBIENT PARTICLE ANIMATION
   ========================================================== */

const canvas = $("#particles");
const ctx = canvas.getContext("2d");

let w = 0;
let h = 0;
let dpr = 1;
let particles = [];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.6);

  w = window.innerWidth;
  h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(
    75,
    Math.floor(w * h / 15000)
  );

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.4 + Math.random() * 1.4,
    a: 0.15 + Math.random() * 0.55,
    s: 0.08 + Math.random() * 0.24,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, w, h);

  particles.forEach(particle => {
    particle.y -= particle.s;

    if (particle.y < -5) {
      particle.y = h + 5;
      particle.x = Math.random() * w;
    }

    particle.phase += 0.012;

    const alpha =
      particle.a *
      (0.65 + 0.35 * Math.sin(particle.phase));

    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      particle.r,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `rgba(226,193,132,${alpha})`;

    ctx.fill();
  });

  if (!reducedMotion) {
    requestAnimationFrame(drawParticles);
  }
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawParticles();


/* ==========================================================
   BACKGROUND MUSIC — COMPLETE FIX
   ========================================================== */

/* ==========================================================
   BACKGROUND MUSIC — FIXED
   ========================================================== */

(() => {
  const musicOpen = $("#musicOpen");
  const musicClose = $("#musicClose");
  const musicDock = $("#musicDock");
  const fileInput = $("#musicFile");
  const audio = $("#backgroundMusic");
  const playButton = $("#musicPlay");
  const stopButton = $("#musicStop");
  const volumeSlider = $("#musicVolume");
  const status = $("#musicStatus");

  if (!audio || !playButton || !stopButton || !status) {
    console.error("Music elements are missing.");
    return;
  }

  let selectedSongURL = null;

  // Load the song stored beside index.html.
  audio.src = "./song.mp3";
  audio.loop = true;
  audio.preload = "auto";
  audio.muted = false;
  audio.volume = volumeSlider
    ? Number(volumeSlider.value)
    : 0.45;

  playButton.disabled = false;
  stopButton.disabled = false;

  audio.load();

  // Attempt autoplay. The browser may block it.
  
  // Attempt autoplay when the page loads.
  // Attempt to play music when the page loads.
audio.muted = false;
audio.volume = volumeSlider
  ? Number(volumeSlider.value)
  : 0.45;

audio.play().catch(error => {
  console.log("Browser blocked autoplay:", error);
  status.textContent = "Click anywhere to start music";
});

  // Start music on the first user interaction if autoplay fails.
  function startMusicOnInteraction() {
    if (!audio.paused) {
      document.removeEventListener(
        "pointerdown",
        startMusicOnInteraction
      );
      return;
    }

    audio.play().then(() => {
      status.textContent = "Now playing";
      document.removeEventListener(
        "pointerdown",
        startMusicOnInteraction
      );
    }).catch(error => {
      console.error("Music playback failed:", error);
    });
  }

  document.addEventListener(
    "pointerdown",
    startMusicOnInteraction
  );

  audio.addEventListener("canplay", () => {
    if (audio.paused) {
      status.textContent = "Song ready — tap to play";
    }
  });

  audio.addEventListener("play", () => {
    playButton.textContent = "Ⅱ";
    status.textContent = "Now playing";
  });

  audio.addEventListener("pause", () => {
    playButton.textContent = "▶";
  });

  audio.addEventListener("error", () => {
    status.textContent =
      "Song could not load. Check song.mp3 and its path.";
    console.error("Audio error:", audio.error);
  });

  
if (musicOpen && musicDock) {
  musicOpen.addEventListener("click", async () => {
    musicDock.classList.add("open");

    // Restart the song from 0:00.
    audio.currentTime = 0;

    try {
      await audio.play();
      status.textContent = "Now playing from the beginning";
    } catch (error) {
      status.textContent = "Press Play to start the music";
      console.error("Music playback failed:", error);
    }
  });
}


  if (musicClose && musicDock) {
    musicClose.addEventListener("click", () => {
      musicDock.classList.remove("open");
    });
  }

  // Keep the option to select a different song.
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file || !file.type.startsWith("audio/")) return;

      if (selectedSongURL) {
        URL.revokeObjectURL(selectedSongURL);
      }

      selectedSongURL = URL.createObjectURL(file);
      audio.src = selectedSongURL;
      audio.load();

      audio.play().then(() => {
        status.textContent = "Now playing";
      }).catch(() => {
        status.textContent = "Press Play to start your song";
      });
    });
  }

  playButton.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      console.error("Music playback failed:", error);
      status.textContent = "Unable to play music";
    }
  });

  stopButton.addEventListener("click", () => {
    audio.pause();

    if (audio.readyState > 0) {
      audio.currentTime = 0;
    }

    status.textContent = "Song ready to play";
  });

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      audio.volume = Number(volumeSlider.value);
    });
  }

  window.addEventListener("beforeunload", () => {
    if (selectedSongURL) {
      URL.revokeObjectURL(selectedSongURL);
    }
  });
})();



/* ==========================================================
   PAUSE GAME TIMER WHEN TAB IS HIDDEN
   ========================================================== */

document.addEventListener("visibilitychange", () => {
  if (document.hidden && balloonTimer) {
    clearInterval(balloonTimer);

    balloonTimer = null;
    balloonsRunning = false;
  }
});
