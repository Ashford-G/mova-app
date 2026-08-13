/* =========================================================
   MOVA V1 FRONTEND
   Money Operating System
   ========================================================= */


/* -----------------------------
   NAVIGATION
----------------------------- */

const pageTitles = {
  dashboard: "Good afternoon, welcome back.",
  intelligence: "Your financial intelligence.",
  safe: "Protect your money.",
  price: "Make smarter purchases.",
  goals: "Build your financial future.",
  coach: "Talk to MOVA.",
  profile: "Your MOVA account."
};


function openPage(page) {

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active-page");
  });

  const target = document.getElementById(page);

  if (target) {
    target.classList.add("active-page");
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");

    if (item.dataset.page === page) {
      item.classList.add("active");
    }
  });

  const title = document.getElementById("pageTitle");

  if (title && pageTitles[page]) {
    title.textContent = pageTitles[page];
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  closeSidebar();
}


/* -----------------------------
   SIDEBAR
----------------------------- */

function toggleSidebar() {

  const sidebar = document.querySelector(".sidebar");

  sidebar.classList.toggle("open");
}


function closeSidebar() {

  const sidebar = document.querySelector(".sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}


/* -----------------------------
   NOTIFICATIONS
----------------------------- */

function showNotification() {

  alert(
    "MOVA Alert\n\n" +
    "Your financial score is currently 74/100.\n\n" +
    "MOVA recommends protecting your next $50."
  );
}


/* -----------------------------
   MOVA SAFE
----------------------------- */

function scanSafe() {

  const input = document
    .getElementById("safeInput")
    .value
    .trim();

  const result = document.getElementById("safeResult");

  if (!input) {

    result.classList.remove("hidden");

    result.innerHTML = `
      <strong>⚠ Nothing to scan</strong>
      <p>
        Paste a message, number, payment request or website
        into the box first.
      </p>
    `;

    return;
  }


  /*
    V1 DEMO ANALYSIS

    This is NOT real AI.

    Later this function will call the MOVA backend,
    which can combine:
      - AI analysis
      - community reports
      - verified businesses
      - reputation databases
      - transaction intelligence
  */

  const suspiciousWords = [
    "otp",
    "password",
    "send money",
    "urgent",
    "activate",
    "winner",
    "investment",
    "guaranteed",
    "verify account",
    "blocked"
  ];

  const lower = input.toLowerCase();

  const matches = suspiciousWords.filter(word =>
    lower.includes(word)
  );


  result.classList.remove("hidden");


  if (matches.length >= 2) {

    result.innerHTML = `
      <strong>🔴 HIGH RISK</strong>

      <p>
        MOVA detected several warning signals in this message.
        Possible indicators include requests involving:
        ${matches.join(", ")}.
      </p>

      <p style="margin-top:8px;">
        <b>Recommendation:</b>
        Do not send money or disclose passwords, PINs or OTPs
        until the recipient has been independently verified.
      </p>
    `;

  } else if (matches.length === 1) {

    result.innerHTML = `
      <strong style="color:#d97706;">
        🟡 BE CAREFUL
      </strong>

      <p>
        MOVA detected a potential warning sign:
        <b>${matches[0]}</b>.
      </p>

      <p style="margin-top:8px;">
        Verify the sender independently before taking action.
      </p>
    `;

  } else {

    result.innerHTML = `
      <strong style="color:#16a34a;">
        🟢 NO OBVIOUS RED FLAGS
      </strong>

      <p>
        MOVA did not detect common scam patterns in the
        information provided.
      </p>

      <p style="margin-top:8px;">
        This does not guarantee that the sender or business
        is legitimate. Always verify important payments.
      </p>
    `;
  }
}


/* -----------------------------
   MOVA PRICE
----------------------------- */

function searchPrice() {

  const input = document
    .getElementById("priceInput")
    .value
    .trim();

  const results = document.getElementById("priceResults");

  if (!input) {

    results.innerHTML = `
      <div class="empty-state">
        <span>⌕</span>
        <h3>Enter a product</h3>
        <p>Search for something you want to buy.</p>
      </div>
    `;

    return;
  }


  /*
    V1 DEMO DATA.

    Later this becomes a real database containing:
      - verified merchants
      - user-submitted prices
      - historical prices
      - location
      - product variants
  */


  results.innerHTML = `

    <div class="price-result">

      <div class="price-result-header">

        <div>
          <span class="label">SEARCH RESULT</span>
          <h3>${escapeHTML(input)}</h3>
        </div>

        <span class="good-price">
          🟢 Good price
        </span>

      </div>

      <div class="price-data">

        <div>
          <span>Best reported</span>
          <strong>$120</strong>
        </div>

        <div>
          <span>Average</span>
          <strong>$128</strong>
        </div>

        <div>
          <span>Highest</span>
          <strong>$145</strong>
        </div>

      </div>

      <p style="
        color:#667085;
        font-size:11px;
        margin-top:15px;
      ">
        Demo data — real merchant and community pricing
        will be connected in a future MOVA backend release.
      </p>

    </div>

  `;
}


/* -----------------------------
   AI COACH
----------------------------- */

function handleChat(event) {

  if (event.key === "Enter") {
    sendMessage();
  }
}


function sendMessage() {

  const input = document.getElementById("chatInput");

  const message = input.value.trim();

  if (!message) return;


  const chat = document.getElementById("chatWindow");


  /* USER MESSAGE */

  const userMessage = document.createElement("div");

  userMessage.className = "message user";

  userMessage.innerHTML = `
    <div>
      <p>${escapeHTML(message)}</p>
    </div>
  `;

  chat.appendChild(userMessage);


  input.value = "";


  /* DEMO AI RESPONSE */

  setTimeout(() => {

    const aiMessage = document.createElement("div");

    aiMessage.className = "message ai";

    aiMessage.innerHTML = `
      <div class="message-avatar">M</div>

      <div>
        <strong>MOVA</strong>

        <p>
          Based on your current MOVA profile, I would first
          look at your safe-to-spend amount, upcoming
          obligations and savings target before making that
          decision.
        </p>
      </div>
    `;

    chat.appendChild(aiMessage);

    chat.scrollTop = chat.scrollHeight;

  }, 500);
}


/* -----------------------------
   GOALS
----------------------------- */

function createGoal() {

  const name = prompt("What are you saving for?");

  if (!name) return;

  const amount = prompt(
    "What is your target amount in USD?"
  );

  if (!amount) return;

  alert(
    `Goal created!\n\n${name}\nTarget: $${amount}\n\n` +
    "MOVA will help you track your progress."
  );
}


/* -----------------------------
   PREMIUM
----------------------------- */

function openPremium() {

  document
    .getElementById("premiumModal")
    .classList.remove("hidden");
}


function closePremium() {

  document
    .getElementById("premiumModal")
    .classList.add("hidden");
}


/* -----------------------------
   SECURITY
----------------------------- */

function escapeHTML(value) {

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* -----------------------------
   LOCAL STORAGE
----------------------------- */

function saveMovaData(key, value) {

  localStorage.setItem(
    `mova_${key}`,
    JSON.stringify(value)
  );
}


function getMovaData(key, fallback = null) {

  const value = localStorage.getItem(
    `mova_${key}`
  );

  if (!value) {
    return fallback;
  }

  try {

    return JSON.parse(value);

  } catch {

    return fallback;

  }
}


/* -----------------------------
   INITIALIZE
----------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  openPage("dashboard");

  console.log(
    "MOVA V1 initialized successfully."
  );

});
