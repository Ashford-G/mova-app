/* ============================================================
   MOVA V4
   MONEY OPERATING SYSTEM
   SECURED APPLICATION CONTROLLER
   ============================================================ */


/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL =
  "https://nqcxolvcakmnmpcdxqpb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_DD6vSjZ0HLFggyg-ttpMkQ_DWGpaUdh";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


console.log(
  "MOVA SUPABASE INITIALIZED"
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

let transactionHistoryFilter = "all";


/*
   Make the current user available to security.js.
*/

window.currentUser = null;


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  document.querySelectorAll(selector);


/* ============================================================
   SAFE EVENT LISTENER
   ============================================================ */

function on(
  selector,
  event,
  handler
) {

  const element =
    $(selector);

  if (!element)
    return;

  element.addEventListener(
    event,
    handler
  );

}


/* ============================================================
   SECURITY HELPERS
   ============================================================ */

function requireSecurity() {

  if (
    window.MOVASecurity &&
    !window.MOVASecurity.requireAuthentication()
  ) {

    return false;

  }

  if (!currentUser) {

    showToast(
      "Please sign in first."
    );

    showAuthScreen();

    return false;

  }

  return true;

}


function safeText(
  value,
  maxLength = 500
) {

  if (
    window.MOVASecurity
  ) {

    const result =
      window.MOVASecurity.validateText(
        value,
        "Input",
        maxLength
      );

    if (!result.valid)
      return "";

    return result.value;

  }

  return String(
    value ?? ""
  )
    .trim()
    .slice(0, maxLength);

}


function safeAmount(value) {

  if (
    window.MOVASecurity
  ) {

    return window.MOVASecurity
      .validateAmount(value);

  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return {
      valid: false,
      message: "Enter a valid amount."
    };

  }

  return {
    valid: true,
    value:
      Math.round(
        amount * 100
      ) / 100
  };

}


/* ============================================================
   AUTH MESSAGES
   ============================================================ */

function showAuthMessage(
  message,
  type = ""
) {

  const box =
    $("#authMessage");

  if (!box)
    return;

  box.textContent =
    message;

  box.className =
    `message ${type}`;

}


/* ============================================================
   SWITCH TO SIGNUP
   ============================================================ */

function switchToSignup() {

  $("#loginForm")
    ?.classList
    .add("hidden");

  $("#signupForm")
    ?.classList
    .remove("hidden");


  if ($("#authTitle"))
    $("#authTitle").textContent =
      "Build your financial command center.";


  if ($("#authSubtitle"))
    $("#authSubtitle").textContent =
      "Create your MOVA account and start your 7-day Pro experience.";


  if ($("#switchText"))
    $("#switchText").textContent =
      "Already have an account?";


  if ($("#switchAuth"))
    $("#switchAuth").textContent =
      "Sign in";


  showAuthMessage("");

}


/* ============================================================
   SWITCH TO LOGIN
   ============================================================ */

function switchToLogin() {

  $("#signupForm")
    ?.classList
    .add("hidden");

  $("#loginForm")
    ?.classList
    .remove("hidden");


  if ($("#authTitle"))
    $("#authTitle").textContent =
      "Welcome back.";


  if ($("#authSubtitle"))
    $("#authSubtitle").textContent =
      "Understand your money. Protect your money. Make better decisions.";


  if ($("#switchText"))
    $("#switchText").textContent =
      "Don't have an account?";


  if ($("#switchAuth"))
    $("#switchAuth").textContent =
      "Create account";


  showAuthMessage("");

}


/* ============================================================
   AUTH SWITCH
   ============================================================ */

on(
  "#switchAuth",
  "click",
  () => {

    if (
      $("#signupForm")
        ?.classList
        .contains("hidden")
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

$$(".plan-card")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        $$(".plan-card")
          .forEach(c =>
            c.classList.remove(
              "selected"
            )
          );


        card.classList.add(
          "selected"
        );


        selectedPlan =
          card.dataset.plan ||
          "free";

      }
    );

  });


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

$$(".password-toggle")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const input =
          document.getElementById(
            button.dataset.target
          );

        if (!input)
          return;


        input.type =
          input.type === "password"
            ? "text"
            : "password";

      }
    );

  });


/* ============================================================
   SIGN UP
   ============================================================ */

on(
  "#signupForm",
  "submit",
  async event => {

    event.preventDefault();


    showAuthMessage(
      "Creating your MOVA account..."
    );


    const name =
      safeText(
        $("#signupName")?.value,
        100
      );


    const email =
      $("#signupEmail")
        ?.value
        .trim()
        .toLowerCase();


    const password =
      $("#signupPassword")
        ?.value || "";


    if (!name) {

      showAuthMessage(
        "Please enter your full name.",
        "error"
      );

      return;

    }


    if (
      window.MOVASecurity
    ) {

      const emailCheck =
        window.MOVASecurity
          .validateEmail(email);

      if (!emailCheck.valid) {

        showAuthMessage(
          emailCheck.message,
          "error"
        );

        return;

      }


      const passwordCheck =
        window.MOVASecurity
          .validatePassword(password);

      if (!passwordCheck.valid) {

        showAuthMessage(
          passwordCheck.message,
          "error"
        );

        return;

      }

    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .signUp({

            email,

            password,

            options: {

              data: {

                full_name:
                  name,

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

        currentUser =
          data.user;

        window.currentUser =
          currentUser;


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

      console.error(
        "MOVA signup error:",
        error
      );


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

on(
  "#loginForm",
  "submit",
  async event => {

    event.preventDefault();


    showAuthMessage(
      "Signing you in..."
    );


    const email =
      $("#loginEmail")
        ?.value
        .trim()
        .toLowerCase();


    const password =
      $("#loginPassword")
        ?.value || "";


    if (
      window.MOVASecurity
    ) {

      const emailCheck =
        window.MOVASecurity
          .validateEmail(email);

      if (!emailCheck.valid) {

        showAuthMessage(
          emailCheck.message,
          "error"
        );

        return;

      }

    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({

            email,

            password

          });


      if (error)
        throw error;


      currentUser =
        data.user;

      window.currentUser =
        currentUser;


      await loadApplication();

    } catch (error) {

      console.error(
        "MOVA login error:",
        error
      );


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

on(
  "#forgotPassword",
  "click",
  async () => {

    const email =
      $("#loginEmail")
        ?.value
        .trim()
        .toLowerCase();


    if (!email) {

      showAuthMessage(
        "Enter your email address first.",
        "error"
      );

      return;

    }


    if (
      window.MOVASecurity
    ) {

      const emailCheck =
        window.MOVASecurity
          .validateEmail(email);

      if (!emailCheck.valid) {

        showAuthMessage(
          emailCheck.message,
          "error"
        );

        return;

      }

    }


    try {

      const {
        error
      } =
        await supabaseClient
          .auth
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
        error.message ||
        "Unable to send reset instructions.",
        "error"
      );

    }

  }
);


/* ============================================================
   AUTH STATE
   ============================================================ */

supabaseClient
  .auth
  .onAuthStateChange(
    async (
      event,
      session
    ) => {

      if (session?.user) {

        currentUser =
          session.user;

        window.currentUser =
          currentUser;


        await loadApplication();

      } else {

        currentUser =
          null;

        window.currentUser =
          null;

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
    ?.classList
    .add("hidden");


  $("#appScreen")
    ?.classList
    .remove("hidden");


  await loadProfile();

  await loadTransactions();

  await loadGoals();

  await loadDebts();


  updateDashboard();

  updateIntelligence();

  updateProfile();

  renderTransactionHistory();

}


/* ============================================================
   LOAD PROFILE
   ============================================================ */

async function loadProfile() {

  if (!requireSecurity())
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile load error:",
      error
    );

    return;

  }


  currentProfile =
    data;


  if (!currentProfile) {

    await createProfileFallback();

  }

}


/* ============================================================
   CREATE PROFILE FALLBACK
   ============================================================ */

async function createProfileFallback() {

  if (!requireSecurity())
    return;


  const metadata =
    currentUser.user_metadata ||
    {};


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
          safeText(
            metadata.full_name,
            100
          ),

        email:
          currentUser.email,

        subscription_plan:
          metadata.selected_plan ||
          "free",

        subscription_status:
          "trial",

        trial_started_at:
          new Date().toISOString(),

        trial_ends_at:
          new Date(
            Date.now() +
            7 *
            24 *
            60 *
            60 *
            1000
          ).toISOString()

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Profile creation error:",
      error
    );

    return;

  }


  currentProfile =
    data;

}


/* ============================================================
   LOAD TRANSACTIONS
   ============================================================ */

async function loadTransactions() {

  if (!requireSecurity())
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("transactions")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "transaction_date",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Transaction load error:",
      error
    );

    transactions = [];

    return;

  }


  transactions =
    data || [];


  renderTransactionHistory();

}


/* ============================================================
   ADD TRANSACTION
   ============================================================ */

on(
  "#transactionForm",
  "submit",
  async event => {

    event.preventDefault();


    if (!requireSecurity())
      return;


    const type =
      $("#transactionType")
        ?.value;


    const amountResult =
      safeAmount(
        $("#transactionAmount")
          ?.value
      );


    if (!amountResult.valid) {

      showToast(
        amountResult.message
      );

      return;

    }


    const category =
      safeText(
        $("#transactionCategory")
          ?.value,
        100
      );


    const description =
      safeText(
        $("#transactionDescription")
          ?.value,
        300
      );


    const date =
      $("#transactionDate")
        ?.value;


    if (!category) {

      showToast(
        "Enter a transaction category."
      );

      return;

    }


    if (!date) {

      showToast(
        "Select a transaction date."
      );

      return;

    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("transactions")
          .insert({

            user_id:
              currentUser.id,

            amount:
              amountResult.value,

            transaction_type:
              type === "income"
                ? "income"
                : "expense",

            category,

            description,

            transaction_date:
              date

          })
          .select()
          .single();


      if (error)
        throw error;


      if (data) {

        transactions.unshift(
          data
        );

      }


      closeModal(
        "transactionModal"
      );


      event.target.reset();


      if ($("#transactionDate")) {

        $("#transactionDate")
          .value =
          new Date()
            .toISOString()
            .split("T")[0];

      }


      /*
         Reload from Supabase so the
         database remains the source
         of truth.
      */

      await loadTransactions();


      updateDashboard();

      updateIntelligence();

      renderTransactionHistory();


      showToast(
        "Transaction saved securely."
      );


      if (
        window.MOVASecurity
      ) {

        window.MOVASecurity
          .logSecurityEvent(
            "transaction_created"
          );

      }

    } catch (error) {

      console.error(
        "Transaction creation error:",
        error
      );


      showToast(
        error.message ||
        "Unable to save transaction."
      );

    }

  }
);


/* ============================================================
   GOALS
   ============================================================ */

async function loadGoals() {

  if (!requireSecurity())
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("goals")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Goals load error:",
      error
    );

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

on(
  "#goalForm",
  "submit",
  async event => {

    event.preventDefault();


    if (!requireSecurity())
      return;


    const goalName =
      safeText(
        $("#goalName")
          ?.value,
        100
      );


    const targetResult =
      safeAmount(
        $("#goalTarget")
          ?.value
      );


    const currentValue =
      Number(
        $("#goalCurrent")
          ?.value || 0
      );


    const deadline =
      $("#goalDeadline")
        ?.value ||
        null;


    if (!goalName) {

      showToast(
        "Enter a goal name."
      );

      return;

    }


    if (!targetResult.valid) {

      showToast(
        "Enter a valid target amount."
      );

      return;

    }


    if (
      !Number.isFinite(
        currentValue
      ) ||
      currentValue < 0
    ) {

      showToast(
        "Enter a valid current amount."
      );

      return;

    }


    if (
      currentValue >
      targetResult.value
    ) {

      showToast(
        "Current amount cannot be greater than the target."
      );

      return;

    }


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
            targetResult.value,

          current_amount:
            currentValue,

          deadline

        });


    if (error) {

      console.error(
        "Goal creation error:",
        error
      );

      showToast(
        error.message
      );

      return;

    }


    closeModal(
      "goalModal"
    );


    event.target.reset();


    await loadGoals();


    showToast(
      "Goal created securely."
    );

  }
);


/* ============================================================
   DEBTS
   ============================================================ */

async function loadDebts() {

  if (!requireSecurity())
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("debts")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "Debt load error:",
      error
    );

    debts = [];

    return;

  }


  debts =
    data || [];

}


/* ============================================================
   DASHBOARD
   ============================================================ */

function updateDashboard() {

  let income = 0;
  let expenses = 0;


  transactions.forEach(
    transaction => {

      const amount =
        Number(
          transaction.amount
        ) || 0;


      if (
        transaction.transaction_type ===
        "income"
      ) {

        income += amount;

      } else if (
        transaction.transaction_type ===
        "expense"
      ) {

        expenses += amount;

      }

    }
  );


  const savings =
    Number(
      currentProfile
        ?.financial_profiles
        ?.total_savings || 0
    );


  const debtAmount =
    debts.reduce(
      (
        total,
        debt
      ) =>
        total +
        Number(
          debt.balance || 0
        ),
      0
    );


  const moneyPosition =
    income -
    expenses -
    debtAmount;


  const upcoming =
    debts.reduce(
      (
        total,
        debt
      ) =>
        total +
        Number(
          debt.payment_amount || 0
        ),
      0
    );


  const safeSpend =
    Math.max(
      0,
      moneyPosition -
      upcoming
    );


  if ($("#trueMoneyPosition"))
    $("#trueMoneyPosition")
      .textContent =
      formatMoney(
        moneyPosition
      );


  if ($("#incomeAmount"))
    $("#incomeAmount")
      .textContent =
      formatMoney(
        income
      );


  if ($("#savingsAmount"))
    $("#savingsAmount")
      .textContent =
      formatMoney(
        savings
      );


  if ($("#upcomingAmount"))
    $("#upcomingAmount")
      .textContent =
      formatMoney(
        upcoming
      );


  if ($("#safeToSpend"))
    $("#safeToSpend")
      .textContent =
      formatMoney(
        safeSpend
      );


  const score =
    calculateMovaScore(
      income,
      expenses,
      savings,
      debtAmount
    );


  if ($("#movaScore"))
    $("#movaScore")
      .textContent =
      score === null
        ? "—"
        : score;


  if ($("#scoreText"))
    $("#scoreText")
      .textContent =
      getScoreText(
        score
      );


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


  if (
    income >
    expenses
  )
    score += 15;


  if (
    income > 0
  )
    score += 10;


  if (
    savings > 0
  )
    score += 10;


  if (
    debts === 0
  )
    score += 10;


  if (
    income > 0 &&
    expenses / income < 0.7
  )
    score += 5;


  return Math.min(
    100,
    Math.max(
      0,
      score
    )
  );

}


function getScoreText(
  score
) {

  if (
    score === null
  )
    return "Build your financial profile";


  if (
    score >= 80
  )
    return "Financially strong";


  if (
    score >= 65
  )
    return "Financially stable";


  if (
    score >= 50
  )
    return "Room for improvement";


  return "Needs attention";

}


/* ============================================================
   RECENT TRANSACTIONS
   ============================================================ */

function renderRecentTransactions() {

  const container =
    $("#recentTransactions");


  if (!container)
    return;


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
      .map(
        transaction => {

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
                      transaction.description ||
                      ""
                    )}
                  </small>

                </div>

              </div>

              <strong
                class="${isIncome ? "income" : "expense"}"
              >
                ${isIncome ? "+" : "-"}
                ${formatMoney(
                  transaction.amount
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");

}


/* ============================================================
   TRANSACTION HISTORY
   ============================================================ */

function renderTransactionHistory() {

  const container =
    $("#transactionHistoryList");


  if (!container)
    return;


  let filtered =
    transactions;


  if (
    transactionHistoryFilter !==
    "all"
  ) {

    filtered =
      transactions.filter(
        transaction =>
          transaction.transaction_type ===
          transactionHistoryFilter
      );

  }


  let income = 0;
  let expenses = 0;


  transactions.forEach(
    transaction => {

      const amount =
        Number(
          transaction.amount
        ) || 0;


      if (
        transaction.transaction_type ===
        "income"
      ) {

        income += amount;

      } else if (
        transaction.transaction_type ===
        "expense"
      ) {

        expenses += amount;

      }

    }
  );


  const net =
    income -
    expenses;


  if ($("#historyIncome"))
    $("#historyIncome")
      .textContent =
      formatMoney(
        income
      );


  if ($("#historyExpenses"))
    $("#historyExpenses")
      .textContent =
      formatMoney(
        expenses
      );


  if ($("#historyNet"))
    $("#historyNet")
      .textContent =
      formatMoney(
        net
      );


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No transactions yet</h3>
        <p>
          Your income and expenses will appear here.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    filtered
      .map(
        transaction => {

          const amount =
            Number(
              transaction.amount
            ) || 0;


          const isIncome =
            transaction.transaction_type ===
            "income";


          const sign =
            isIncome
              ? "+"
              : "-";


          const date =
            transaction.transaction_date
              ? new Date(
                  transaction.transaction_date
                ).toLocaleDateString()
              : "";


          return `
            <div class="transaction-history-item">

              <div class="transaction-history-icon">
                ${isIncome ? "↑" : "↓"}
              </div>

              <div class="transaction-history-info">

                <strong>
                  ${escapeHTML(
                    transaction.category ||
                    "Uncategorized"
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    transaction.description ||
                    (
                      isIncome
                        ? "Income"
                        : "Expense"
                    )
                  )}
                </span>

                <small>
                  ${escapeHTML(
                    date
                  )}
                </small>

              </div>

              <div
                class="transaction-history-amount
                ${isIncome ? "income" : "expense"}"
              >
                ${sign}${formatMoney(
                  amount
                )}
              </div>

            </div>
          `;

        }
      )
      .join("");

}


/* ============================================================
   TRANSACTION HISTORY FILTERS
   ============================================================ */

$$(".transaction-filter")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          transactionHistoryFilter =
            button.dataset.filter ||
            "all";


          $$(".transaction-filter")
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          renderTransactionHistory();

        }
      );

    }
  );


/* ============================================================
   HISTORY ADD TRANSACTION
   ============================================================ */

on(
  "#historyAddTransaction",
  "click",
  () => {

    if (!requireSecurity())
      return;


    openModal(
      "transactionModal"
    );

  }
);


/* ============================================================
   GOAL RENDERING
   ============================================================ */

function renderGoals() {

  const dashboard =
    $("#dashboardGoals");

  const page =
    $("#goalsPageList");


  if (!dashboard || !page)
    return;


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
    goals
      .map(
        goal => {

          const target =
            Number(
              goal.target_amount ||
              0
            );


          const current =
            Number(
              goal.current_amount ||
              0
            );


          const percentage =
            target > 0
              ? Math.min(
                  100,
                  (
                    current /
                    target
                  ) * 100
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
                ${
                  goal.deadline
                    ? "Deadline: " +
                      escapeHTML(
                        goal.deadline
                      )
                    : "No deadline set"
                }
              </p>

              <div class="progress">

                <div
                  style="width:${percentage}%"
                ></div>

              </div>

              <div class="goal-numbers">

                <span>
                  ${formatMoney(
                    current
                  )}
                </span>

                <span>
                  ${formatMoney(
                    target
                  )}
                </span>

              </div>

            </div>
          `;

        }
      )
      .join("");


  dashboard.innerHTML =
    goals
      .slice(0, 3)
      .map(
        goal => {

          const target =
            Number(
              goal.target_amount ||
              0
            );


          const current =
            Number(
              goal.current_amount ||
              0
            );


          const percentage =
            target > 0
              ? Math.min(
                  100,
                  (
                    current /
                    target
                  ) * 100
                )
              : 0;


          return `
            <div class="goal-item">

              <div>

                <strong>
                  ${escapeHTML(
                    goal.goal_name
                  )}
                </strong>

                <small>
                  ${Math.round(
                    percentage
                  )}% complete
                </small>

              </div>

              <strong>
                ${formatMoney(
                  target
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");


  page.innerHTML =
    html;

}


/* ============================================================
   INTELLIGENCE
   ============================================================ */

function updateIntelligence() {

  if (
    !transactions.length
  ) {

    if ($("#spendingInsight"))
      $("#spendingInsight")
        .textContent =
        "Add transactions to generate spending intelligence.";

    return;

  }


  const expenses =
    transactions.filter(
      transaction =>
        transaction.transaction_type ===
        "expense"
    );


  const total =
    expenses.reduce(
      (
        sum,
        transaction
      ) =>
        sum +
        Number(
          transaction.amount
        ),
      0
    );


  const categories = {};


  expenses.forEach(
    transaction => {

      const category =
        transaction.category ||
        "Other";


      categories[category] =
        (
          categories[category] ||
          0
        ) +
        Number(
          transaction.amount
        );

    }
  );


  let largestCategory =
    "None";

  let largestAmount =
    0;


  Object.entries(
    categories
  )
    .forEach(
      (
        [category, amount]
      ) => {

        if (
          amount >
          largestAmount
        ) {

          largestCategory =
            category;

          largestAmount =
            amount;

        }

      }
    );


  if ($("#spendingInsight"))
    $("#spendingInsight")
      .textContent =
      `You have recorded ${formatMoney(total)} in expenses. Your largest recorded spending category is ${largestCategory} at ${formatMoney(largestAmount)}.`;


  if ($("#healthInsight"))
    $("#healthInsight")
      .textContent =
      transactions.length >= 5
        ? "Your financial picture is becoming clearer."
        : "Keep recording transactions for a clearer picture.";


  if ($("#futureInsight"))
    $("#futureInsight")
      .textContent =
      total > 0
        ? "Your spending history can now be used to build future projections."
        : "Add financial activity to unlock projections.";

}


/* ============================================================
   MOVA SAFE
   ============================================================ */

on(
  "#analyzeSafe",
  "click",
  async () => {

    if (!requireSecurity())
      return;


    const input =
      safeText(
        $("#safeInput")
          ?.value,
        2000
      );


    if (!input) {

      showToast(
        "Paste something for MOVA Safe to analyze."
      );

      return;

    }


    const result =
      analyzeRiskLocally(
        input
      );


    const safeResult =
      $("#safeResult");


    if (!safeResult)
      return;


    safeResult
      .classList
      .remove("hidden");


    safeResult.className =
      `safe-result risk-${result.level}`;


    safeResult.innerHTML = `

      <span class="eyebrow">
        MOVA SAFE RESULT
      </span>

      <h2>
        ${escapeHTML(
          result.title
        )}
      </h2>

      <p>
        Risk score:
        <strong>
          ${result.score}/100
        </strong>
      </p>

      <p>
        ${escapeHTML(
          result.reason
        )}
      </p>

      <p>
        <strong>
          Recommendation:
        </strong>
        ${escapeHTML(
          result.recommendation
        )}
      </p>

    `;


    const {
      error
    } =
      await supabaseClient
        .from("safe_checks")
        .insert({

          user_id:
            currentUser.id,

          check_type:
            detectCheckType(
              input
            ),

          submitted_value:
            input,

          risk_level:
            result.level,

          risk_score:
            result.score,

          explanation:
            result.reason

        });


    if (error) {

      console.error(
        "MOVA Safe save error:",
        error
      );

    }

  }
);


/* ============================================================
   LOCAL RISK ANALYSIS
   ============================================================ */

function analyzeRiskLocally(
  text
) {

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
        lower.includes(
          word
        )
    );


  if (
    matches.length >= 3
  ) {

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


  if (
    matches.length >= 1
  ) {

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


/* ============================================================
   DETECT SAFE CHECK TYPE
   ============================================================ */

function detectCheckType(
  value
) {

  const text =
    String(value || "");


  if (
    text.includes(
      "http://"
    ) ||
    text.includes(
      "https://"
    )
  )
    return "website";


  if (
    /^\+?[0-9\s-]{7,}$/
      .test(text)
  )
    return "phone";


  return "message";

}


/* ============================================================
   PRICE SEARCH
   ============================================================ */

on(
  "#searchPrice",
  "click",
  searchPrices
);


async function searchPrices() {

  if (!requireSecurity())
    return;


  const query =
    safeText(
      $("#priceSearch")
        ?.value,
      100
    );


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


  if (!container)
    return;


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
    data
      .map(
        item => `

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

                ${
                  item.location
                    ? " · " +
                      escapeHTML(
                        item.location
                      )
                    : ""
                }

              </small>

            </div>

            <div class="price-value">

              ${escapeHTML(
                item.currency ||
                "USD"
              )}

              ${Number(
                item.price
              ).toFixed(2)}

            </div>

          </div>

        `
      )
      .join("");

}


/* ============================================================
   AI COACH
   ============================================================ */

on(
  "#askCoach",
  "click",
  askCoach
);


async function askCoach() {

  if (!requireSecurity())
    return;


  const question =
    safeText(
      $("#coachQuestion")
        ?.value,
      500
    )
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
        transaction =>
          transaction.transaction_type ===
          "income"
      )
      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Number(
            transaction.amount
          ),
        0
      );


  const expenses =
    transactions
      .filter(
        transaction =>
          transaction.transaction_type ===
          "expense"
      )
      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Number(
            transaction.amount
          ),
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


  if ($("#coachAnswer"))
    $("#coachAnswer")
      .textContent =
      answer;


  const {
    error
  } =
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


  if (error) {

    console.error(
      "Coach insight save error:",
      error
    );

  }

}


/* ============================================================
   PROFILE
   ============================================================ */

function updateProfile() {

  if (!currentUser)
    return;


  const metadata =
    currentUser.user_metadata ||
    {};


  const name =
    currentProfile?.full_name ||
    metadata.full_name ||
    "MOVA User";


  if ($("#userFirstName"))
    $("#userFirstName")
      .textContent =
      name
        ? " " +
          name.split(" ")[0]
        : "";


  if ($("#profileName"))
    $("#profileName")
      .textContent =
      name;


  if ($("#profileEmail"))
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


  if ($("#membershipTitle"))
    $("#membershipTitle")
      .textContent =
      plan === "pro"
        ? "MOVA Pro"
        : "MOVA Free";


  if ($("#membershipText"))
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

  const element =
    $("#trialCountdown");


  if (!element)
    return;


  if (
    !currentProfile?.trial_ends_at
  ) {

    element.textContent =
      "";

    return;

  }


  const end =
    new Date(
      currentProfile.trial_ends_at
    );


  const difference =
    end -
    new Date();


  if (
    difference <= 0
  ) {

    element.textContent =
      "Your trial has ended. Choose your MOVA plan.";

    return;

  }


  const days =
    Math.floor(
      difference /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  const hours =
    Math.floor(
      (
        difference %
        (
          1000 *
          60 *
          60 *
          24
        )
      ) /
      (
        1000 *
        60 *
        60
      )
    );


  element.textContent =
    `Pro trial: ${days} day${days === 1 ? "" : "s"} ${hours}h remaining`;

}


/* ============================================================
   NAVIGATION
   ============================================================ */

$$(".nav-item")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;


          $$(".nav-item")
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          $$(".page")
            .forEach(
              item =>
                item.classList.remove(
                  "active-page"
                )
            );


          const target =
            document.getElementById(
              `page-${page}`
            );


          if (target)
            target.classList.add(
              "active-page"
            );


          /*
             Refresh transaction history
             whenever the page is opened.
          */

          if (
            page === "transactions"
          ) {

            renderTransactionHistory();

          }


          $("#sidebar")
            ?.classList
            .remove("open");

        }
      );

    }
  );


/* ============================================================
   MOBILE MENU
   ============================================================ */

on(
  "#menuButton",
  "click",
  () => {

    $("#sidebar")
      ?.classList
      .toggle("open");

  }
);


/* ============================================================
   MODALS
   ============================================================ */

function openModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal)
    return;


  modal.classList.remove(
    "hidden"
  );

}


function closeModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal)
    return;


  modal.classList.add(
    "hidden"
  );

}


$$("[data-close]")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            button.dataset.close
          );

        }
      );

    }
  );


/* ============================================================
   ADD TRANSACTION BUTTONS
   ============================================================ */

on(
  "#addTransactionButton",
  "click",
  () => {

    if (!requireSecurity())
      return;

    openModal(
      "transactionModal"
    );

  }
);


on(
  "#addTransactionButton2",
  "click",
  () => {

    if (!requireSecurity())
      return;

    openModal(
      "transactionModal"
    );

  }
);


/* ============================================================
   GOAL BUTTONS
   ============================================================ */

on(
  "#addGoalButton",
  "click",
  () => {

    if (!requireSecurity())
      return;

    openModal(
      "goalModal"
    );

  }
);


on(
  "#createGoalButton",
  "click",
  () => {

    if (!requireSecurity())
      return;

    openModal(
      "goalModal"
    );

  }
);


/* ============================================================
   SIGN OUT
   ============================================================ */

on(
  "#signOutButton",
  "click",
  async () => {

    try {

      await supabaseClient
        .auth
        .signOut();


      currentUser =
        null;

      currentProfile =
        null;

      transactions =
        [];

      goals =
        [];

      debts =
        [];


      window.currentUser =
        null;


      showAuthScreen();


      showToast(
        "You have been signed out."
      );

    } catch (error) {

      console.error(
        "Sign out error:",
        error
      );

      showToast(
        "Unable to sign out."
      );

    }

  }
);


/* ============================================================
   SHOW AUTH SCREEN
   ============================================================ */

function showAuthScreen() {

  $("#appScreen")
    ?.classList
    .add("hidden");


  $("#authScreen")
    ?.classList
    .remove("hidden");


  switchToLogin();

}


/* ============================================================
   FORMAT MONEY
   ============================================================ */

function formatMoney(
  amount
) {

  const number =
    Number(
      amount || 0
    );


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

function escapeHTML(
  value
) {

  if (
    window.MOVASecurity
  ) {

    return window.MOVASecurity
      .escapeHTML(value);

  }


  return String(
    value ?? ""
  )
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

        return map[
          character
        ];

      }
    );

}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
  message
) {

  const toast =
    $("#toast");


  if (!toast)
    return;


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () =>
      toast.classList.remove(
        "show"
      ),
    3000
  );

}


/* ============================================================
   INITIALIZE DATE
   ============================================================ */

if (
  $("#transactionDate")
) {

  $("#transactionDate")
    .value =
    new Date()
      .toISOString()
      .split("T")[0];

}


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


    if (
      data.session?.user
    ) {

      currentUser =
        data.session.user;

      window.currentUser =
        currentUser;


      await loadApplication();

    } else {

      showAuthScreen();

    }

  } catch (error) {

    console.error(
      "MOVA initialization error:",
      error
    );


    showAuthScreen();

  }

})();


/* ============================================================
   MOVA APP INITIALIZED
   ============================================================ */

console.log(
  "MOVA V4 secured application loaded."
);