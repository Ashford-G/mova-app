/* =====================================================
   MOVA V3
   Supabase-powered frontend
===================================================== */


/* =====================================================
   SUPABASE CONFIG
=====================================================

   IMPORTANT:
   Replace the two values below with your Supabase
   project URL and PUBLISHABLE/ANON key.

   NEVER put the Supabase service_role key here.
===================================================== */

const SUPABASE_URL =
  " https://nqcxolvcakmmpcdxqpb.supabase.co ";

const SUPABASE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let selectedPlan = "pro";
let transactions = [];
let goals = [];


/* =====================================================
   DOM
===================================================== */

const authScreen =
  document.getElementById("authScreen");

const appScreen =
  document.getElementById("appScreen");

const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");

const authMessage =
  document.getElementById("authMessage");


/* =====================================================
   START
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  setCurrentDate();

  setTodayDate();

  passwordStrengthListener();

  await checkSession();

});


/* =====================================================
   SESSION
===================================================== */

async function checkSession() {

  try {

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

      currentUser = session.user;

      await showApp();

    } else {

      showAuth();

    }

  } catch (error) {

    console.error(error);

    showAuth();

  }

}


/* =====================================================
   AUTH UI
===================================================== */

function showAuth() {

  authScreen.classList.remove("hidden");

  appScreen.classList.add("hidden");

}


function showLogin() {

  loginForm.classList.remove("hidden");

  signupForm.classList.add("hidden");

  document
    .getElementById("loginTab")
    .classList.add("active");

  document
    .getElementById("signupTab")
    .classList.remove("active");

  document.getElementById("authTitle").textContent =
    "Welcome back.";

  document.getElementById("authSubtitle").textContent =
    "Sign in to your financial command center.";

  clearMessage();

}


function showSignup() {

  signupForm.classList.remove("hidden");

  loginForm.classList.add("hidden");

  document
    .getElementById("signupTab")
    .classList.add("active");

  document
    .getElementById("loginTab")
    .classList.remove("active");

  document.getElementById("authTitle").textContent =
    "Build your money system.";

  document.getElementById("authSubtitle").textContent =
    "Create your MOVA account in less than a minute.";

  clearMessage();

}


function clearMessage() {

  authMessage.textContent = "";

}


/* =====================================================
   PLAN
===================================================== */

function selectPlan(plan) {

  selectedPlan = plan;

  document
    .getElementById("freePlan")
    .classList.remove("selected");

  document
    .getElementById("proPlan")
    .classList.remove("selected");

  document
    .getElementById(
      plan === "free" ? "freePlan" : "proPlan"
    )
    .classList.add("selected");

}


/* =====================================================
   PASSWORD
===================================================== */

function togglePassword(id) {

  const input = document.getElementById(id);

  input.type =
    input.type === "password"
      ? "text"
      : "password";

}


function passwordStrengthListener() {

  const password =
    document.getElementById("signupPassword");

  password.addEventListener("input", () => {

    const value = password.value;

    let strength = 0;

    if (value.length >= 8)
      strength++;

    if (/[A-Z]/.test(value))
      strength++;

    if (/[0-9]/.test(value))
      strength++;

    if (/[^A-Za-z0-9]/.test(value))
      strength++;

    const bar =
      document.getElementById("passwordStrength");

    bar.className =
      "password-strength";

    if (strength === 1)
      bar.classList.add("weak");

    if (strength === 2)
      bar.classList.add("medium");

    if (strength === 3)
      bar.classList.add("strong");

    if (strength >= 4)
      bar.classList.add("very-strong");

  });

}


/* =====================================================
   SIGN UP
===================================================== */

signupForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const name =
    document.getElementById("signupName").value.trim();

  const email =
    document.getElementById("signupEmail").value.trim();

  const password =
    document.getElementById("signupPassword").value;

  const terms =
    document.getElementById("terms").checked;


  if (!terms) {

    showMessage(
      "Please accept the Terms and Privacy Policy.",
      true
    );

    return;

  }


  showMessage("Creating your MOVA account...");


  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email,

      password,

      options: {

        data: {

          full_name: name,

          selected_plan: selectedPlan

        }

      }

    });


    if (error)
      throw error;


    /*
      Supabase may require email confirmation
      depending on your Auth settings.
    */

    if (!data.session) {

      showMessage(
        "Account created. Check your email to confirm your account."
      );

      return;

    }


    currentUser = data.user;

    await showApp();


  } catch (error) {

    console.error(error);

    showMessage(
      error.message || "Unable to create account.",
      true
    );

  }

});


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();


  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;


  showMessage("Signing you in...");


  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({

      email,

      password

    });


    if (error)
      throw error;


    currentUser = data.user;

    await showApp();


  } catch (error) {

    console.error(error);

    showMessage(
      error.message || "Unable to sign in.",
      true
    );

  }

});


/* =====================================================
   PASSWORD RESET
===================================================== */

async function forgotPassword() {

  const email =
    prompt("Enter the email address connected to your MOVA account:");

  if (!email)
    return;


  try {

    const {
      error
    } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin
      }
    );


    if (error)
      throw error;


    alert(
      "Password reset instructions have been sent to your email."
    );


  } catch (error) {

    alert(
      error.message ||
      "Unable to send password reset email."
    );

  }

}


/* =====================================================
   SHOW APPLICATION
===================================================== */

async function showApp() {

  authScreen.classList.add("hidden");

  appScreen.classList.remove("hidden");

  await loadProfile();

  await loadFinancialProfile();

  await loadTransactions();

  await loadGoals();

  await loadSubscription();

  calculateDashboard();

}


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

  if (!currentUser)
    return;


  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(error);

    return;

  }


  const name =
    data?.full_name ||
    currentUser.email?.split("@")[0] ||
    "MOVA User";


  document.getElementById("profileName").textContent =
    name;


  document.getElementById("profileEmail").textContent =
    currentUser.email || "—";


  document.getElementById("userAvatar").textContent =
    name.charAt(0).toUpperCase();


  document.getElementById("profileAvatar").textContent =
    name.charAt(0).toUpperCase();

}


/* =====================================================
   FINANCIAL PROFILE
===================================================== */

async function loadFinancialProfile() {

  if (!currentUser)
    return;


  const {
    data,
    error
  } = await supabaseClient
    .from("financial_profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(error);

    return;

  }


  window.financialProfile =
    data || {

      monthly_income: 0,

      current_savings: 0,

      currency: "USD"

    };

}


/* =====================================================
   TRANSACTIONS
===================================================== */

async function loadTransactions() {

  const {
    data,
    error
  } = await supabaseClient
    .from("transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("transaction_date", {
      ascending: false
    })
    .limit(50);


  if (error) {

    console.error(error);

    return;

  }


  transactions = data || [];

  renderTransactions();

}


/* =====================================================
   RENDER TRANSACTIONS
===================================================== */

function renderTransactions() {

  const list =
    document.getElementById("transactionsList");


  if (!transactions.length) {

    list.innerHTML = `
      <div class="empty-state">
        <div>◎</div>
        <strong>No transactions yet</strong>
        <p>Start recording your money movement.</p>
      </div>
    `;

    return;

  }


  list.innerHTML =
    transactions.slice(0, 8).map(t => {

      const isIncome =
        t.transaction_type === "income";


      const sign =
        isIncome ? "+" : "-";


      return `

        <div class="transaction-item">

          <div class="transaction-info">

            <div class="transaction-icon">
              ${isIncome ? "↗" : "↘"}
            </div>

            <div>

              <strong>
                ${escapeHTML(t.category)}
              </strong>

              <small>
                ${escapeHTML(
                  t.description || t.transaction_date
                )}
              </small>

            </div>

          </div>

          <div class="
            transaction-amount
            ${isIncome ? "income-type" : "expense"}
          ">
            ${sign}${
              Number(t.amount).toFixed(2)
            }
          </div>

        </div>

      `;

    }).join("");

}


/* =====================================================
   ADD TRANSACTION
===================================================== */

document
  .getElementById("transactionForm")
  .addEventListener("submit", async (event) => {

    event.preventDefault();


    const type =
      document.getElementById("transactionType").value;

    const amount =
      Number(
        document.getElementById("transactionAmount").value
      );

    const category =
      document
        .getElementById("transactionCategory")
        .value
        .trim();

    const description =
      document
        .getElementById("transactionDescription")
        .value
        .trim();

    const date =
      document.getElementById("transactionDate").value;


    const {
      error
    } = await supabaseClient
      .from("transactions")
      .insert({

        user_id: currentUser.id,

        transaction_type: type,

        amount,

        category,

        description,

        transaction_date: date

      });


    if (error) {

      alert(error.message);

      return;

    }


    closeTransactionModal();

    await loadTransactions();

    calculateDashboard();

  });


/* =====================================================
   GOALS
===================================================== */

async function loadGoals() {

  const {
    data,
    error
  } = await supabaseClient
    .from("goals")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    return;

  }


  goals = data || [];

  renderGoals();

}


/* =====================================================
   RENDER GOALS
===================================================== */

function renderGoals() {

  const list =
    document.getElementById("goalsList");

  const fullList =
    document.getElementById("fullGoalsList");


  if (!goals.length) {

    list.innerHTML = `
      <div class="empty-state">
        <div>◎</div>
        <strong>No goals yet</strong>
        <p>Give your money a destination.</p>
      </div>
    `;

    fullList.innerHTML = "";

    return;

  }


  const html =
    goals.map(goal => {

      const percentage =
        goal.target_amount > 0
          ? Math.min(
              100,
              (goal.current_amount /
                goal.target_amount) * 100
            )
          : 0;


      return `

        <div class="goal-item">

          <div class="goal-row">

            <strong>
              ${escapeHTML(goal.goal_name)}
            </strong>

            <span>
              ${percentage.toFixed(0)}%
            </span>

          </div>

          <div class="progress">

            <span style="width:${percentage}%"></span>

          </div>

          <small style="color:#718078;font-size:9px">

            $${Number(goal.current_amount).toFixed(2)}
            /
            $${Number(goal.target_amount).toFixed(2)}

          </small>

        </div>

      `;

    }).join("");


  list.innerHTML = html;

  fullList.innerHTML = `

    <div class="panel">

      ${html}

    </div>

  `;

}


/* =====================================================
   ADD GOAL
===================================================== */

document
  .getElementById("goalForm")
  .addEventListener("submit", async (event) => {

    event.preventDefault();


    const name =
      document.getElementById("goalName").value.trim();

    const target =
      Number(
        document.getElementById("goalTarget").value
      );

    const current =
      Number(
        document.getElementById("goalCurrent").value || 0
      );

    const deadline =
      document.getElementById("goalDeadline").value || null;


    const {
      error
    } = await supabaseClient
      .from("goals")
      .insert({

        user_id: currentUser.id,

        goal_name: name,

        target_amount: target,

        current_amount: current,

        deadline

      });


    if (error) {

      alert(error.message);

      return;

    }


    closeGoalModal();

    await loadGoals();

    calculateDashboard();

  });


/* =====================================================
   DASHBOARD CALCULATIONS
===================================================== */

function calculateDashboard() {

  const income =
    transactions
      .filter(t => t.transaction_type === "income")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );


  const expenses =
    transactions
      .filter(t => t.transaction_type === "expense")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );


  const savings =
    Number(
      window.financialProfile?.current_savings || 0
    );


  const monthlyIncome =
    Number(
      window.financialProfile?.monthly_income || income
    );


  const trueMoney =
    savings + income - expenses;


  const safeSpend =
    Math.max(0, trueMoney);


  document.getElementById("trueMoney").textContent =
    money(trueMoney);


  document.getElementById("safeSpend").textContent =
    money(safeSpend);


  document.getElementById("savings").textContent =
    money(savings);


  document.getElementById("income").textContent =
    money(monthlyIncome);


  document.getElementById("upcoming").textContent =
    "$0";


  calculateMovaScore(
    savings,
    income,
    expenses
  );

}


/* =====================================================
   MOVA SCORE
===================================================== */

function calculateMovaScore(
  savings,
  income,
  expenses
) {

  if (!income && !savings && !expenses) {

    document.getElementById("movaScore").textContent =
      "—";

    document.getElementById("scoreStatus").textContent =
      "Add financial data";

    return;

  }


  let score = 50;


  if (income > expenses)
    score += 15;


  if (savings > 0)
    score += 10;


  if (savings >= income)
    score += 10;


  if (expenses < income * .7)
    score += 10;


  score = Math.min(100, score);


  document.getElementById("movaScore").textContent =
    score;


  let status = "Building stability";

  if (score >= 80)
    status = "Financially strong";

  else if (score >= 65)
    status = "Financially stable";

  else if (score >= 50)
    status = "Needs attention";

  else
    status = "High attention";


  document.getElementById("scoreStatus").textContent =
    status;

}


/* =====================================================
   SUBSCRIPTION
===================================================== */

async function loadSubscription() {

  const {
    data,
    error
  } = await supabaseClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(error);

    return;

  }


  if (!data)
    return;


  const plan =
    data.plan === "pro"
      ? "MOVA Pro"
      : "MOVA Free";


  document.getElementById("subscriptionPlan")
    .textContent = plan;


  if (data.status === "trialing") {

    const end =
      new Date(data.trial_end);

    document.getElementById("trialText")
      .textContent =
      `Your Pro trial ends ${end.toLocaleDateString()}.`;

  }

}


/* =====================================================
   MOVA SAFE — BASIC FRONTEND DEMO
===================================================== */

function analyzeSafe() {

  const text =
    document.getElementById("safeInput").value.trim();

  const result =
    document.getElementById("safeResult");


  if (!text) {

    result.innerHTML =
      "<p style='color:#ff9999;margin-top:15px'>Enter something to analyze.</p>";

    return;

  }


  const suspiciousWords = [

    "otp",
    "password",
    "send money",
    "activate",
    "winner",
    "urgent",
    "investment",
    "verification fee",
    "claim"

  ];


  const lower =
    text.toLowerCase();


  const matches =
    suspiciousWords.filter(word =>
      lower.includes(word)
    );


  if (matches.length >= 2) {

    result.innerHTML = `

      <div style="
        margin-top:15px;
        padding:15px;
        border:1px solid rgba(255,100,100,.25);
        border-radius:12px;
        background:rgba(255,100,100,.05);
      ">

        <strong style="color:#ff8888">
          🔴 HIGH RISK
        </strong>

        <p style="
          color:#aaa;
          font-size:11px;
          margin-top:7px;
        ">
          This message contains patterns commonly associated
          with suspicious financial requests.
        </p>

        <small style="color:#718078">
          Do not send money, passwords or OTPs until independently verified.
        </small>

      </div>

    `;

  } else {

    result.innerHTML = `

      <div style="
        margin-top:15px;
        padding:15px;
        border:1px solid rgba(101,230,162,.2);
        border-radius:12px;
      ">

        <strong style="color:#65e6a2">
          🟡 REVIEW CAREFULLY
        </strong>

        <p style="
          color:#aaa;
          font-size:11px;
          margin-top:7px;
        ">
          MOVA did not detect strong risk patterns,
          but this does not guarantee that the person or business is legitimate.
        </p>

      </div>

    `;

  }

}


/* =====================================================
   NAVIGATION
===================================================== */

function openSection(section) {

  document
    .querySelectorAll(".app-section")
    .forEach(el =>
      el.classList.remove("active-section")
    );


  const target =
    document.getElementById(section);


  if (target)
    target.classList.add("active-section");


  document
    .querySelectorAll(".nav-item")
    .forEach(el =>
      el.classList.remove("active")
    );


  event?.currentTarget?.classList.add("active");


  const titles = {

    dashboard: "Good afternoon.",

    intelligence: "Your financial intelligence.",

    safe: "Protect your money.",

    price: "Know what things should cost.",

    goals: "Give your money a destination.",

    coach: "Let's talk about your money.",

    profile: "Your MOVA account."

  };


  document.getElementById("pageTitle")
    .textContent =
    titles[section] || "MOVA";


  if (window.innerWidth < 900)
    toggleSidebar(false);

}


function toggleSidebar(force) {

  const sidebar =
    document.querySelector(".sidebar");


  if (force === false) {

    sidebar.classList.remove("open");

    return;

  }


  sidebar.classList.toggle("open");

}


/* =====================================================
   MODALS
===================================================== */

function openTransactionModal() {

  document
    .getElementById("transactionModal")
    .classList.remove("hidden");

  setTodayDate();

}


function closeTransactionModal() {

  document
    .getElementById("transactionModal")
    .classList.add("hidden");

  document
    .getElementById("transactionForm")
    .reset();

  setTodayDate();

}


function openGoalModal() {

  document
    .getElementById("goalModal")
    .classList.remove("hidden");

}


function closeGoalModal() {

  document
    .getElementById("goalModal")
    .classList.add("hidden");

  document
    .getElementById("goalForm")
    .reset();

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  await supabaseClient.auth.signOut();

  currentUser = null;

  appScreen.classList.add("hidden");

  authScreen.classList.remove("hidden");

  showLogin();

}


/* =====================================================
   DATE
===================================================== */

function setCurrentDate() {

  const now = new Date();

  document.getElementById("currentDate")
    .textContent =
    now.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    ).toUpperCase();

}


function setTodayDate() {

  const input =
    document.getElementById("transactionDate");

  if (!input)
    return;


  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");


  input.value =
    `${year}-${month}-${day}`;

}


/* =====================================================
   HELPERS
===================================================== */

function money(value) {

  const currency =
    window.financialProfile?.currency || "USD";


  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency
    }
  ).format(value);

}


function showMessage(message, error = false) {

  authMessage.textContent =
    message;

  authMessage.style.color =
    error
      ? "#ff8888"
      : "var(--green)";

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =====================================================
   AUTH STATE LISTENER
===================================================== */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (
      event === "SIGNED_IN" &&
      session
    ) {

      currentUser =
        session.user;

      await showApp();

    }


    if (event === "SIGNED_OUT") {

      currentUser = null;

      showAuth();

    }

  }
);