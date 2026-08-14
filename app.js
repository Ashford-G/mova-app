/* ============================================================
   MOVA V4
   Money Operating System
   ============================================================ */


/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================

   IMPORTANT:

   Replace the two values below.

   DO NOT put your Supabase SECRET key here.

   Use:
   1. Project URL
   2. Publishable key

   ============================================================ */

const SUPABASE_URL =
  "https://nqcxolvcakmnnpcdxqpb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_DD6vSjZ0HLFggyg-ttpMkQ_DWGpaUdh";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* ============================================================
   GLOBAL STATE
   ============================================================ */

let currentUser = null;
let currentProfile = null;
let selectedPlan = "free";

let transactions = [];
let goals = [];
let debts = [];


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* ============================================================
   AUTH UI
   ============================================================ */

function showAuthMessage(message, type = "") {

  const box = $("#authMessage");

  box.textContent = message;

  box.className =
    `message ${type}`;
}


function switchToSignup() {

  $("#loginForm").classList.add("hidden");
  $("#signupForm").classList.remove("hidden");

  $("#authTitle").textContent =
    "Build your financial command center.";

  $("#authSubtitle").textContent =
    "Create your MOVA account and start your 7-day Pro experience.";

  $("#switchText").textContent =
    "Already have an account?";

  $("#switchAuth").textContent =
    "Sign in";

  showAuthMessage("");
}


function switchToLogin() {

  $("#signupForm").classList.add("hidden");
  $("#loginForm").classList.remove("hidden");

  $("#authTitle").textContent =
    "Welcome back.";

  $("#authSubtitle").textContent =
    "Understand your money. Protect your money. Make better decisions.";

  $("#switchText").textContent =
    "Don't have an account?";

  $("#switchAuth").textContent =
    "Create account";

  showAuthMessage("");
}


/* ============================================================
   AUTH SWITCH
   ============================================================ */

$("#switchAuth").addEventListener(
  "click",
  () => {

    if (
      $("#signupForm").classList.contains("hidden")
    ) {

      switchToSignup();

    } else {

      switchToLogin();

    }

  }
);


/* ============================================================
   PLAN SELECTOR
   ============================================================ */

$$(".plan-card").forEach(card => {

  card.addEventListener(
    "click",
    () => {

      $$(".plan-card").forEach(c =>
        c.classList.remove("selected")
      );

      card.classList.add("selected");

      selectedPlan =
        card.dataset.plan;

    }
  );

});


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

$$(".password-toggle").forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const input =
        document.getElementById(
          button.dataset.target
        );

      if (input.type === "password") {

        input.type = "text";

      } else {

        input.type = "password";

      }

    }
  );

});


/* ============================================================
   SIGN UP
   ============================================================ */

$("#signupForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showAuthMessage(
      "Creating your MOVA account..."
    );

    const name =
      $("#signupName").value.trim();

    const email =
      $("#signupEmail").value.trim();

    const password =
      $("#signupPassword").value;

    if (password.length < 8) {

      showAuthMessage(
        "Password must contain at least 8 characters.",
        "error"
      );

      return;
    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

          email,

          password,

          options: {

            data: {

              full_name: name,

              selected_plan:
                selectedPlan

            },

            emailRedirectTo:
              window.location.origin

          }

        });


      if (error)
        throw error;


      if (data.session) {

        showAuthMessage(
          "Account created. Welcome to MOVA.",
          "success"
        );

        await loadApplication();

      } else {

        showAuthMessage(
          "Account created. Check your email to confirm your account.",
          "success"
        );

      }

    } catch (error) {

      console.error(error);

      showAuthMessage(
        error.message ||
        "Unable to create your account.",
        "error"
      );

    }

  }
);


/* ============================================================
   SIGN IN
   ============================================================ */

$("#loginForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showAuthMessage(
      "Signing you in..."
    );

    const email =
      $("#loginEmail").value.trim();

    const password =
      $("#loginPassword").value;


    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({

          email,

          password

        });


      if (error)
        throw error;


      currentUser =
        data.user;

      await loadApplication();

    } catch (error) {

      console.error(error);

      showAuthMessage(
        error.message ||
        "Unable to sign in.",
        "error"
      );

    }

  }
);


/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

$("#forgotPassword").addEventListener(
  "click",
  async () => {

    const email =
      $("#loginEmail").value.trim();

    if (!email) {

      showAuthMessage(
        "Enter your email address first.",
        "error"
      );

      return;
    }


    try {

      const {
        error
      } =
        await supabaseClient.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                window.location.origin
            }
          );


      if (error)
        throw error;


      showAuthMessage(
        "Password reset instructions sent to your email.",
        "success"
      );

    } catch (error) {

      showAuthMessage(
        error.message,
        "error"
      );

    }

  }
);


/* ============================================================
   AUTH STATE
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (session?.user) {

      currentUser =
        session.user;

      await loadApplication();

    } else {

      showAuthScreen();

    }

  }
);


/* ============================================================
   LOAD APPLICATION
   ============================================================ */

async function loadApplication() {

  if (!currentUser)
    return;

  $("#authScreen")
    .classList.add("hidden");

  $("#appScreen")
    .classList.remove("hidden");


  await loadProfile();

  await loadTransactions();

  await loadGoals();

  await loadDebts();

  updateDashboard();

  updateIntelligence();

  updateProfile();

}


/* ============================================================
   LOAD PROFILE
   ============================================================ */

async function loadProfile() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(error);

    return;
  }


  currentProfile =
    data;


  if (!currentProfile) {

    await createProfileFallback();

  }

}


/* ============================================================
   PROFILE FALLBACK
   ============================================================ */

async function createProfileFallback() {

  const metadata =
    currentUser.user_metadata || {};


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .insert({

        id:
          currentUser.id,

        full_name:
          metadata.full_name || "",

        email:
          currentUser.email,

        subscription_plan:
          metadata.selected_plan || "free",

        subscription_status:
          "trial",

        trial_started_at:
          new Date().toISOString(),

        trial_ends_at:
          new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
          ).toISOString()

      })
      .select()
      .single();


  if (!error)
    currentProfile = data;

}


/* ============================================================
   TRANSACTIONS
   ============================================================ */

async function loadTransactions() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("transactions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order(
        "transaction_date",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    transactions = [];

    return;
  }


  transactions =
    data || [];

}


/* ============================================================
   ADD TRANSACTION
   ============================================================ */

$("#transactionForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const type =
        $("#transactionType").value;

      const amount =
        Number(
          $("#transactionAmount").value
        );

      const category =
        $("#transactionCategory").value.trim();

      const description =
        $("#transactionDescription").value.trim();

      const date =
        $("#transactionDate").value;


      if (!amount || amount <= 0) {

        showToast(
          "Enter a valid amount."
        );

        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from("transactions")
          .insert({

            user_id:
              currentUser.id,

            amount,

            transaction_type:
              type,

            category,

            description,

            transaction_date:
              date

          });


      if (error) {

        console.error(error);

        showToast(
          error.message
        );

        return;
      }


      closeModal(
        "transactionModal"
      );

      event.target.reset();

      await loadTransactions();

      updateDashboard();

      updateIntelligence();

      showToast(
        "Transaction saved."
      );

    }
  );


/* ============================================================
   GOALS
   ============================================================ */

async function loadGoals() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("goals")
      .select("*")
      .eq("user_id", currentUser.id)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    goals = [];

    return;
  }


  goals =
    data || [];

  renderGoals();

}


/* ============================================================
   CREATE GOAL
   ============================================================ */

$("#goalForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const goalName =
        $("#goalName").value.trim();

      const target =
        Number(
          $("#goalTarget").value
        );

      const current =
        Number(
          $("#goalCurrent").value || 0
        );

      const deadline =
        $("#goalDeadline").value ||
        null;


      const {
        error
      } =
        await supabaseClient
          .from("goals")
          .insert({

            user_id:
              currentUser.id,

            goal_name:
              goalName,

            target_amount:
              target,

            current_amount:
              current,

            deadline

          });


      if (error) {

        showToast(
          error.message
        );

        return;
      }


      closeModal("goalModal");

      event.target.reset();

      await loadGoals();

      showToast(
        "Goal created."
      );

    }
  );


/* ============================================================
   DEBTS
   ============================================================ */

async function loadDebts() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("debts")
      .select("*")
      .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    debts = [];

    return;
  }


  debts =
    data || [];

}


/* ============================================================
   DASHBOARD CALCULATIONS
   ============================================================ */

function updateDashboard() {

  let income = 0;

  let expenses = 0;


  transactions.forEach(transaction => {

    if (
      transaction.transaction_type ===
      "income"
    ) {

      income +=
        Number(transaction.amount);

    } else {

      expenses +=
        Number(transaction.amount);

    }

  });


  const savings =
    currentProfile?.financial_profiles
      ?.total_savings || 0;


  const debtAmount =
    debts.reduce(
      (total, debt) =>
        total +
        Number(debt.balance || 0),
      0
    );


  const moneyPosition =
    income -
    expenses -
    debtAmount;


  const upcoming =
    debts.reduce(
      (total, debt) =>
        total +
        Number(debt.payment_amount || 0),
      0
    );


  const safeSpend =
    Math.max(
      0,
      moneyPosition -
      upcoming
    );


  $("#trueMoneyPosition")
    .textContent =
      formatMoney(moneyPosition);

  $("#incomeAmount")
    .textContent =
      formatMoney(income);

  $("#savingsAmount")
    .textContent =
      formatMoney(savings);

  $("#upcomingAmount")
    .textContent =
      formatMoney(upcoming);

  $("#safeToSpend")
    .textContent =
      formatMoney(safeSpend);


  const score =
    calculateMovaScore(
      income,
      expenses,
      savings,
      debtAmount
    );


  $("#movaScore")
    .textContent =
      score === null
        ? "—"
        : score;


  $("#scoreText")
    .textContent =
      getScoreText(score);


  renderRecentTransactions();

}


/* ============================================================
   MOVA SCORE
   ============================================================ */

function calculateMovaScore(
  income,
  expenses,
  savings,
  debts
) {

  if (
    income === 0 &&
    expenses === 0 &&
    savings === 0 &&
    debts === 0
  ) {

    return null;

  }


  let score = 50;


  if (income > expenses)
    score += 15;

  if (income > 0)
    score += 10;

  if (savings > 0)
    score += 10;

  if (debts === 0)
    score += 10;

  if (
    income > 0 &&
    expenses / income < .7
  )
    score += 5;


  return Math.min(
    100,
    Math.max(0, score)
  );

}


function getScoreText(score) {

  if (score === null)
    return "Build your financial profile";

  if (score >= 80)
    return "Financially strong";

  if (score >= 65)
    return "Financially stable";

  if (score >= 50)
    return "Room for improvement";

  return "Needs attention";

}


/* ============================================================
   RECENT TRANSACTIONS
   ============================================================ */

function renderRecentTransactions() {

  const container =
    $("#recentTransactions");


  if (!transactions.length) {

    container.innerHTML = `
      <div class="empty-state">
        <span>◎</span>
        <strong>No transactions yet</strong>
        <p>Start recording your money movement.</p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    transactions
      .slice(0, 6)
      .map(transaction => {

        const isIncome =
          transaction.transaction_type ===
          "income";

        return `
          <div class="activity-item">

            <div class="activity-left">

              <div class="activity-icon">
                ${isIncome ? "↗" : "↘"}
              </div>

              <div>

                <strong>
                  ${escapeHTML(
                    transaction.category
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    transaction.description || ""
                  )}
                </small>

              </div>

            </div>

            <strong
              class="${isIncome ? "income" : "expense"}"
            >
              ${isIncome ? "+" : "-"}
              ${formatMoney(
                Number(transaction.amount)
              )}
            </strong>

          </div>
        `;

      })
      .join("");

}


/* ============================================================
   GOAL RENDERING
   ============================================================ */

function renderGoals() {

  const dashboard =
    $("#dashboardGoals");

  const page =
    $("#goalsPageList");


  if (!goals.length) {

    dashboard.innerHTML = `
      <div class="empty-state">
        <span>◎</span>
        <strong>No goals yet</strong>
        <p>Give your money a destination.</p>
      </div>
    `;

    page.innerHTML = `
      <div class="empty-state">
        <span>◎</span>
        <strong>No financial goals</strong>
        <p>Create your first goal.</p>
      </div>
    `;

    return;

  }


  const html =
    goals.map(goal => {

      const target =
        Number(goal.target_amount || 0);

      const current =
        Number(goal.current_amount || 0);

      const percentage =
        target > 0
          ? Math.min(
              100,
              (current / target) * 100
            )
          : 0;


      return `
        <div class="goal-card">

          <h3>
            ${escapeHTML(
              goal.goal_name
            )}
          </h3>

          <p>
            ${goal.deadline
              ? "Deadline: " +
                goal.deadline
              : "No deadline set"}
          </p>

          <div class="progress">
            <div
              style="width:${percentage}%"
            ></div>
          </div>

          <div class="goal-numbers">

            <span>
              ${formatMoney(current)}
            </span>

            <span>
              ${formatMoney(target)}
            </span>

          </div>

        </div>
      `;

    }).join("");


  dashboard.innerHTML =
    goals
      .slice(0, 3)
      .map(goal => {

        const percentage =
          goal.target_amount > 0
            ? Math.min(
                100,
                (
                  goal.current_amount /
                  goal.target_amount
                ) * 100
              )
            : 0;

        return `
          <div class="goal-item">

            <div>
              <strong>
                ${escapeHTML(goal.goal_name)}
              </strong>

              <small>
                ${Math.round(percentage)}% complete
              </small>
            </div>

            <strong>
              ${formatMoney(
                goal.target_amount
              )}
            </strong>

          </div>
        `;

      })
      .join("");


  page.innerHTML =
    html;

}


/* ============================================================
   INTELLIGENCE
   ============================================================ */

function updateIntelligence() {

  if (!transactions.length) {

    $("#spendingInsight")
      .textContent =
        "Add transactions to generate spending intelligence.";

    return;

  }


  const expenses =
    transactions.filter(
      t =>
        t.transaction_type ===
        "expense"
    );


  const total =
    expenses.reduce(
      (sum, t) =>
        sum +
        Number(t.amount),
      0
    );


  const categories = {};


  expenses.forEach(t => {

    const category =
      t.category || "Other";

    categories[category] =
      (
        categories[category] || 0
      ) +
      Number(t.amount);

  });


  let largestCategory =
    "None";

  let largestAmount =
    0;


  Object.entries(categories)
    .forEach(
      ([category, amount]) => {

        if (amount > largestAmount) {

          largestCategory =
            category;

          largestAmount =
            amount;

        }

      }
    );


  $("#spendingInsight")
    .textContent =
      `You have recorded ${formatMoney(total)} in expenses. Your largest recorded spending category is ${largestCategory} at ${formatMoney(largestAmount)}.`;


  $("#healthInsight")
    .textContent =
      transactions.length >= 5
        ? "Your financial picture is becoming clearer."
        : "Keep recording transactions for a clearer picture.";


  $("#futureInsight")
    .textContent =
      total > 0
        ? "Your spending history can now be used to build future projections."
        : "Add financial activity to unlock projections.";

}


/* ============================================================
   SAFE
   ============================================================ */

$("#analyzeSafe")
  .addEventListener(
    "click",
    async () => {

      const input =
        $("#safeInput")
          .value
          .trim();


      if (!input) {

        showToast(
          "Paste something for MOVA Safe to analyze."
        );

        return;

      }


      const result =
        analyzeRiskLocally(input);


      $("#safeResult")
        .classList.remove("hidden");

      $("#safeResult")
        .className =
          `safe-result risk-${result.level}`;

      $("#safeResult").innerHTML = `

        <span class="eyebrow">
          MOVA SAFE RESULT
        </span>

        <h2>
          ${result.title}
        </h2>

        <p>
          Risk score:
          <strong>
            ${result.score}/100
          </strong>
        </p>

        <p>
          ${result.reason}
        </p>

        <p>
          <strong>
            Recommendation:
          </strong>
          ${result.recommendation}
        </p>

      `;


      await supabaseClient
        .from("safe_checks")
        .insert({

          user_id:
            currentUser.id,

          check_type:
            detectCheckType(input),

          submitted_value:
            input,

          risk_level:
            result.level,

          risk_score:
            result.score,

          explanation:
            result.reason

        });

    }
  );


function analyzeRiskLocally(text) {

  const lower =
    text.toLowerCase();


  const dangerWords = [

    "otp",
    "password",
    "send money",
    "pay first",
    "activation fee",
    "claim your prize",
    "urgent",
    "investment",
    "guaranteed profit",
    "verify your account",
    "account blocked",
    "winner"

  ];


  const matches =
    dangerWords.filter(
      word =>
        lower.includes(word)
    );


  if (matches.length >= 3) {

    return {

      level: "high",

      score: 90,

      title: "HIGH RISK",

      reason:
        `MOVA detected several warning patterns: ${matches.join(", ")}.`,

      recommendation:
        "Do not send money, passwords, OTPs or sensitive information until the sender has been independently verified."

    };

  }


  if (matches.length >= 1) {

    return {

      level: "medium",

      score: 60,

      title: "BE CAREFUL",

      reason:
        `MOVA detected a potential warning pattern: ${matches.join(", ")}.`,

      recommendation:
        "Verify the person or business independently before paying or sharing information."

    };

  }


  return {

    level: "low",

    score: 20,

    title: "LOW SIGNAL RISK",

    reason:
      "No obvious high-risk patterns were detected by this basic screening.",

    recommendation:
      "This is not a guarantee that the transaction is safe. Verify important payments independently."

  };

}


function detectCheckType(value) {

  if (
    value.includes("http://") ||
    value.includes("https://")
  )
    return "website";

  if (
    /^\+?[0-9\s-]{7,}$/.test(value)
  )
    return "phone";

  return "message";

}


/* ============================================================
   PRICE SEARCH
   ============================================================ */

$("#searchPrice")
  .addEventListener(
    "click",
    searchPrices
  );


async function searchPrices() {

  const query =
    $("#priceSearch")
      .value
      .trim();


  if (!query) {

    showToast(
      "Enter a product name."
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("price_reports")
      .select("*")
      .ilike(
        "product_name",
        `%${query}%`
      )
      .order(
        "reported_at",
        {
          ascending: false
        }
      )
      .limit(30);


  if (error) {

    showToast(
      error.message
    );

    return;

  }


  const container =
    $("#priceResults");


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">
        <span>◇</span>
        <strong>No price reports yet</strong>
        <p>
          MOVA Price does not have enough community data for this product yet.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    data.map(item => `

      <div class="price-item">

        <div>

          <strong>
            ${escapeHTML(
              item.product_name
            )}
          </strong>

          <small>
            ${escapeHTML(
              item.merchant_name ||
              "Merchant not specified"
            )}
            ${item.location
              ? " · " +
                escapeHTML(item.location)
              : ""}
          </small>

        </div>

        <div class="price-value">
          ${escapeHTML(
            item.currency || "USD"
          )}
          ${Number(item.price).toFixed(2)}
        </div>

      </div>

    `).join("");

}


/* ============================================================
   AI COACH
   ============================================================ */

$("#askCoach")
  .addEventListener(
    "click",
    askCoach
  );


async function askCoach() {

  const question =
    $("#coachQuestion")
      .value
      .trim()
      .toLowerCase();


  if (!question) {

    showToast(
      "Ask MOVA a question."
    );

    return;

  }


  const income =
    transactions
      .filter(
        t =>
          t.transaction_type ===
          "income"
      )
      .reduce(
        (sum,t) =>
          sum +
          Number(t.amount),
        0
      );


  const expenses =
    transactions
      .filter(
        t =>
          t.transaction_type ===
          "expense"
      )
      .reduce(
        (sum,t) =>
          sum +
          Number(t.amount),
        0
      );


  let answer =
    "Keep recording your financial activity and MOVA will become better at understanding your financial position.";


  if (
    question.includes("spend") ||
    question.includes("spending")
  ) {

    answer =
      `You've recorded ${formatMoney(expenses)} in expenses and ${formatMoney(income)} in income. Focus first on your largest spending categories before trying to optimize small expenses.`;

  }


  else if (
    question.includes("save") ||
    question.includes("saving")
  ) {

    answer =
      "A strong starting principle is to give savings a purpose. Create a MOVA goal and decide what amount you can consistently move toward it.";

  }


  else if (
    question.includes("budget")
  ) {

    answer =
      "Start with your recorded income, essential expenses and upcoming obligations. Your safe-to-spend amount should be based on what remains after those obligations.";

  }


  else if (
    question.includes("debt")
  ) {

    answer =
      "List every debt in MOVA with its balance, interest and payment amount. Prioritize expensive debt while maintaining enough cash for essential obligations.";

  }


  $("#coachAnswer")
    .textContent =
      answer;


  await supabaseClient
    .from("ai_insights")
    .insert({

      user_id:
        currentUser.id,

      insight_type:
        "coach_question",

      title:
        "MOVA Coach",

      message:
        answer,

      priority:
        "normal"

    });

}


/* ============================================================
   PROFILE
   ============================================================ */

function updateProfile() {

  const metadata =
    currentUser.user_metadata || {};


  const name =
    currentProfile?.full_name ||
    metadata.full_name ||
    "MOVA User";


  $("#userFirstName")
    .textContent =
      name
        ? " " +
          name.split(" ")[0]
        : "";


  $("#profileName")
    .textContent =
      name;


  $("#profileEmail")
    .textContent =
      currentUser.email ||
      "—";


  const plan =
    currentProfile?.subscription_plan ||
    "free";


  const status =
    currentProfile?.subscription_status ||
    "trial";


  if (
    plan === "pro"
  ) {

    $("#membershipTitle")
      .textContent =
        "MOVA Pro";

  } else {

    $("#membershipTitle")
      .textContent =
        "MOVA Free";

  }


  $("#membershipText")
    .textContent =
      status === "trial"
        ? "Your 7-day MOVA Pro trial is active."
        : "Your current MOVA plan is active.";


  updateTrialCountdown();

}


/* ============================================================
   TRIAL COUNTDOWN
   ============================================================ */

function updateTrialCountdown() {

  if (
    !currentProfile?.trial_ends_at
  ) {

    $("#trialCountdown")
      .textContent =
        "";

    return;

  }


  const end =
    new Date(
      currentProfile.trial_ends_at
    );


  const now =
    new Date();


  const difference =
    end - now;


  if (difference <= 0) {

    $("#trialCountdown")
      .textContent =
        "Your trial has ended. Choose your MOVA plan.";

    return;

  }


  const days =
    Math.floor(
      difference /
      (1000 * 60 * 60 * 24)
    );


  const hours =
    Math.floor(
      (
        difference %
        (1000 * 60 * 60 * 24)
      ) /
      (1000 * 60 * 60)
    );


  $("#trialCountdown")
    .textContent =
      `Pro trial: ${days} day${days === 1 ? "" : "s"} ${hours}h remaining`;

}


/* ============================================================
   NAVIGATION
   ============================================================ */

$$(".nav-item").forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const page =
        button.dataset.page;


      $$(".nav-item")
        .forEach(item =>
          item.classList.remove("active")
        );


      button.classList.add("active");


      $$(".page")
        .forEach(item =>
          item.classList.remove("active-page")
        );


      const target =
        document.getElementById(
          `page-${page}`
        );


      if (target)
        target.classList.add(
          "active-page"
        );


      $("#sidebar")
        .classList.remove("open");

    }
  );

});


/* ============================================================
   MOBILE MENU
   ============================================================ */

$("#menuButton")
  .addEventListener(
    "click",
    () => {

      $("#sidebar")
        .classList.toggle("open");

    }
  );


/* ============================================================
   MODALS
   ============================================================ */

function openModal(id) {

  document
    .getElementById(id)
    .classList.remove("hidden");

}


function closeModal(id) {

  document
    .getElementById(id)
    .classList.add("hidden");

}


$$("[data-close]").forEach(button => {

  button.addEventListener(
    "click",
    () => {

      closeModal(
        button.dataset.close
      );

    }
  );

});


$("#addTransactionButton")
  .addEventListener(
    "click",
    () =>
      openModal("transactionModal")
  );


$("#addTransactionButton2")
  .addEventListener(
    "click",
    () =>
      openModal("transactionModal")
  );


$("#addGoalButton")
  .addEventListener(
    "click",
    () =>
      openModal("goalModal")
  );


$("#createGoalButton")
  .addEventListener(
    "click",
    () =>
      openModal("goalModal")
  );


/* ============================================================
   SIGN OUT
   ============================================================ */

$("#signOutButton")
  .addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      currentUser = null;

      currentProfile = null;

      showAuthScreen();

    }
  );


/* ============================================================
   SHOW AUTH
   ============================================================ */

function showAuthScreen() {

  $("#appScreen")
    .classList.add("hidden");

  $("#authScreen")
    .classList.remove("hidden");

  switchToLogin();

}


/* ============================================================
   FORMAT MONEY
   ============================================================ */

function formatMoney(amount) {

  const number =
    Number(amount || 0);


  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }
  ).format(number);

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => {

        const map = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };

        return map[character];

      }
    );

}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message) {

  const toast =
    $("#toast");

  toast.textContent =
    message;

  toast.classList.add("show");


  setTimeout(
    () =>
      toast.classList.remove("show"),
    3000
  );

}


/* ============================================================
   INITIALIZE DATE
   ============================================================ */

$("#transactionDate")
  .value =
    new Date()
      .toISOString()
      .split("T")[0];


/* ============================================================
   INITIAL SESSION CHECK
   ============================================================ */

(async function init() {

  try {

    const {
      data
    } =
      await supabaseClient
        .auth
        .getSession();


    if (data.session?.user) {

      currentUser =
        data.session.user;

      await loadApplication();

    } else {

      showAuthScreen();

    }

  } catch (error) {

    console.error(
      "MOVA initialization error:",
      error
    );

  }

})();