const pageTitles = {
  dashboard: "Good afternoon, welcome back.",
  intelligence: "Your financial intelligence.",
  safe: "Protect your money.",
  price: "Make smarter purchases.",
  goals: "Build your financial future.",
  debts: "Know what you owe.",
  transactions: "Track every money movement.",
  profile: "Your financial profile.",
  coach: "Talk to MOVA."
};

let selectedPlan = "free";


const demo = {

  profile: {
    income: 650,
    expenses: 438,
    savings: 100,
    currency: "USD"
  },

  goals: [
    {
      name: "Emergency Fund",
      target: 1000,
      current: 680,
      deadline: "2026-12-31"
    },

    {
      name: "New Laptop",
      target: 1000,
      current: 350,
      deadline: "2027-03-01"
    }
  ],

  debts: [],

  transactions: [

    {
      type: "expense",
      amount: 32.5,
      category: "Groceries",
      date: "2026-08-13",
      description: "Grocery shopping"
    },

    {
      type: "expense",
      amount: 5,
      category: "Airtime",
      date: "2026-08-12",
      description: "Airtime"
    },

    {
      type: "income",
      amount: 650,
      category: "Salary",
      date: "2026-08-10",
      description: "Salary"
    }

  ]

};


function getData(){

  return JSON.parse(
    localStorage.getItem("mova_v2_data") || "null"
  ) || demo;

}


function saveData(data){

  localStorage.setItem(
    "mova_v2_data",
    JSON.stringify(data)
  );

}


function getAccount(){

  return JSON.parse(
    localStorage.getItem("mova_v2_account") || "null"
  );

}


function saveAccount(account){

  localStorage.setItem(
    "mova_v2_account",
    JSON.stringify(account)
  );

}


/* PLAN SELECTION */

function selectPlan(plan){

  selectedPlan = plan;

  document
    .querySelectorAll(".plan-card")
    .forEach(card => {

      card.classList.toggle(
        "selected",
        card.dataset.plan === plan
      );

    });

}


/* AUTH */

function continueToAccount(){

  document
    .getElementById("authStep1")
    .classList.add("hidden");

  document
    .getElementById("authStep2")
    .classList.remove("hidden");


  document.getElementById("trialNotice").innerHTML =
    selectedPlan === "pro"

      ? "<b>7-day Pro trial:</b> You get full MOVA Pro access for 7 days. After the trial, Pro is $5/month. Payment will be connected before production launch."

      : "<b>Free plan:</b> Your basic MOVA tools remain available after the trial. You can upgrade to Pro at any time.";

}


function backToPlans(){

  document
    .getElementById("authStep2")
    .classList.add("hidden");

  document
    .getElementById("authStep1")
    .classList.remove("hidden");

}


function createAccount(){

  const name =
    document
      .getElementById("signupName")
      .value
      .trim();

  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("signupPassword")
      .value;


  if(
    !name ||
    !email ||
    password.length < 6
  ){

    alert(
      "Please enter your name, a valid email and a password of at least 6 characters."
    );

    return;
  }


  const account = {

    name,

    email,

    plan: selectedPlan,

    trialStart: Date.now(),

    trialEnds:
      Date.now() +
      7 * 24 * 60 * 60 * 1000,

    proActive:
      selectedPlan === "pro",

    createdAt: Date.now()

  };


  saveAccount(account);


  if(
    !localStorage.getItem("mova_v2_data")
  ){

    saveData(demo);

  }


  launchApp();

}


function launchApp(){

  document
    .getElementById("authScreen")
    .classList.add("hidden");

  document
    .getElementById("app")
    .classList.remove("hidden");

  renderAll();

}


function logout(){

  document
    .getElementById("app")
    .classList.add("hidden");

  document
    .getElementById("authScreen")
    .classList.remove("hidden");

}


/* NAVIGATION */

function openPage(page){

  document
    .querySelectorAll(".page")
    .forEach(p =>
      p.classList.remove("active-page")
    );


  document
    .getElementById(page)
    ?.classList.add("active-page");


  document
    .querySelectorAll(".nav-item")
    .forEach(n =>
      n.classList.toggle(
        "active",
        n.dataset.page === page
      )
    );


  document.getElementById(
    "pageTitle"
  ).textContent =
    pageTitles[page] || "MOVA";


  closeSidebar();


  if(page === "goals")
    renderGoals();

  if(page === "debts")
    renderDebts();

  if(page === "transactions")
    renderTransactions();

  if(page === "intelligence")
    renderIntelligence();


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


function toggleSidebar(){

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

}


function closeSidebar(){

  document
    .querySelector(".sidebar")
    ?.classList.remove("open");

}


/* ACCOUNT */

function updateAccountUI(){

  const account = getAccount();

  if(!account)
    return;


  const initials =
    account.name
      .split(/\s+/)
      .map(x => x[0])
      .join("")
      .slice(0,2)
      .toUpperCase();


  document.getElementById(
    "avatar"
  ).textContent = initials;


  const daysLeft =
    Math.max(
      0,
      Math.ceil(
        (account.trialEnds - Date.now())
        / 86400000
      )
    );


  document.getElementById(
    "planMini"
  ).innerHTML =

    account.plan === "pro"

      ? `<b>MOVA PRO</b><br>${
          account.proActive
            ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial`
            : "Trial ended — $5/month"
        }`

      : `<b>MOVA FREE</b><br>Basic intelligence active`;

}


function enforceTrial(){

  const account = getAccount();

  if(
    !account ||
    account.plan !== "pro"
  )
    return;


  if(
    Date.now() > account.trialEnds &&
    account.proActive
  ){

    account.proActive = false;

    saveAccount(account);

    setTimeout(
      () => openPremium(),
      500
    );

  }

}


function startProTrial(){

  const account = getAccount();

  if(!account)
    return;


  account.plan = "pro";

  account.proActive = true;

  account.trialStart = Date.now();

  account.trialEnds =
    Date.now() +
    7 * 86400000;


  saveAccount(account);

  closePremium();

  updateAccountUI();


  alert(
    "Your 7-day MOVA Pro trial has started. After the trial, Pro will require a $5/month subscription. Payment is not connected in this prototype."
  );

}


function openPremium(){

  document
    .getElementById("premiumModal")
    .classList.remove("hidden");

}


function closePremium(){

  document
    .getElementById("premiumModal")
    .classList.add("hidden");

}


/* MOVA SCORE */

function calculateScore(data){

  const income =
    Number(data.profile.income) || 0;

  const expenses =
    Number(data.profile.expenses) || 0;

  const savings =
    Number(data.profile.savings) || 0;


  if(!income)
    return 50;


  const expenseRatio =
    expenses / income;


  let score = 60;


  if(expenseRatio < .7)
    score += 12;

  else if(expenseRatio < .85)
    score += 5;

  else
    score -= 8;


  if(savings >= income)
    score += 12;

  else if(savings >= income * .5)
    score += 7;

  else if(savings > 0)
    score += 3;


  const debtPressure =
    data.debts.reduce(
      (sum, debt) =>
        sum + Number(debt.balance || 0),
      0
    );


  if(debtPressure > income * 3)
    score -= 12;

  else if(debtPressure > income)
    score -= 5;


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );

}


/* DASHBOARD */

function renderDashboard(){

  const data = getData();

  const profile = data.profile;

  const score =
    calculateScore(data);


  const balance =
    (Number(profile.savings) || 0) +
    (Number(profile.income) || 0) -
    (Number(profile.expenses) || 0);


  document.getElementById(
    "totalBalance"
  ).textContent =
    `$${balance.toFixed(2)}`;


  document.getElementById(
    "safeSpend"
  ).textContent =
    `$${Math.max(
      0,
      Math.round(balance * .44)
    )}`;


  document.getElementById(
    "upcoming"
  ).textContent =
    `$${Math.round(
      (Number(profile.expenses) || 0) * .4
    )}`;


  document.getElementById(
    "savings"
  ).textContent =
    `$${Number(
      profile.savings || 0
    ).toFixed(0)}`;


  document.getElementById(
    "score"
  ).textContent = score;


  document.getElementById(
    "scoreStatus"
  ).textContent =
    score >= 80
      ? "Excellent financial health"
      : score >= 65
        ? "Financially Stable"
        : "Needs attention";


  document.getElementById(
    "scoreSummary"
  ).textContent =

    score >= 80

      ? "Your financial position is strong. Keep protecting your savings and controlling unnecessary spending."

      : score >= 65

        ? "Your finances are healthy, but discretionary spending or your financial buffer can improve."

        : "Your current numbers show areas that need attention. MOVA recommends reviewing expenses, debt and savings.";


  document.getElementById(
    "monthlySpend"
  ).textContent =
    `$${Number(
      profile.expenses || 0
    ).toFixed(0)}`;


  document.querySelector(
    ".score-circle"
  ).style.background =
    `conic-gradient(#111827 ${score}%,#e9edf2 0)`;


  const recent =
    document.getElementById(
      "recentTransactions"
    );


  recent.innerHTML =
    data.transactions
      .slice(0,4)
      .map(transactionHTML)
      .join("");

}


function transactionHTML(transaction){

  return `

    <div class="transaction">

      <div class="transaction-icon">

        ${
          transaction.type === "income"
            ? "💰"
            : "🛒"
        }

      </div>


      <div class="transaction-main">

        <strong>
          ${escapeHTML(
            transaction.description ||
            transaction.category
          )}
        </strong>

        <small>
          ${escapeHTML(
            transaction.category
          )}
          ·
          ${escapeHTML(
            transaction.date || ""
          )}
        </small>

      </div>


      <strong class="${
        transaction.type === "income"
          ? "income"
          : "expense"
      }">

        ${
          transaction.type === "income"
            ? "+"
            : "-"
        }$${Number(
          transaction.amount
        ).toFixed(2)}

      </strong>

    </div>

  `;

}


/* INTELLIGENCE */

function renderIntelligence(){

  const data = getData();

  const score =
    calculateScore(data);

  const profile =
    data.profile;


  const income =
    Number(profile.income) || 0;

  const expenses =
    Number(profile.expenses) || 0;


  document.getElementById(
    "largeScore"
  ).textContent = score;


  document.getElementById(
    "largeScoreStatus"
  ).textContent =

    score >= 80
      ? "Excellent financial health"
      : score >= 65
        ? "Good financial health"
        : "Needs attention";


  document.getElementById(
    "largeScoreText"
  ).textContent =

    `Your income is $${income.toFixed(0)} and monthly expenses are $${expenses.toFixed(0)}. MOVA is using these numbers to identify spending pressure, savings strength and debt risk.`;


  const ratio =
    income
      ? expenses / income
      : 1;


  document.getElementById(
    "analysisList"
  ).innerHTML = [

    [
      "positive",
      "↑",
      "Income stability",
      income
        ? "Your income profile is recorded."
        : "Add your income to improve analysis.",
      income ? 82 : 40
    ],

    [
      ratio < .8
        ? "positive"
        : "warning",

      ratio < .8
        ? "✓"
        : "!",

      "Spending control",

      ratio < .8
        ? "Your expense ratio is within a healthy range."
        : "Your expenses are taking a large share of income.",

      ratio < .8
        ? 82
        : 58
    ],

    [
      Number(profile.savings) >
      income * .5
        ? "positive"
        : "warning",

      Number(profile.savings) >
      income * .5
        ? "✓"
        : "!",

      "Savings behaviour",

      Number(profile.savings) >
      income * .5
        ? "Your savings buffer is building."
        : "Build a stronger savings buffer.",

      Number(profile.savings) >
      income * .5
        ? 80
        : 55
    ],

    [
      data.debts.length
        ? "warning"
        : "positive",

      data.debts.length
        ? "!"
        : "✓",

      "Debt pressure",

      data.debts.length
        ? `${data.debts.length} debt record${
            data.debts.length > 1
              ? "s"
              : ""
          } tracked.`
        : "No debt records currently tracked.",

      data.debts.length
        ? 60
        : 90
    ]

  ]

  .map(item => `

    <div class="analysis-item ${item[0]}">

      <span>
        ${item[1]}
      </span>

      <div>

        <strong>
          ${item[2]}
        </strong>

        <p>
          ${item[3]}
        </p>

      </div>

      <b>
        ${item[4]}
      </b>

    </div>

  `)

  .join("");

}


/* MOVA SAFE */

function scanSafe(){

  const input =
    document
      .getElementById("safeInput")
      .value
      .trim();


  const result =
    document.getElementById(
      "safeResult"
    );


  if(!input){

    result.classList.remove(
      "hidden"
    );

    result.innerHTML =
      "<strong>⚠ Nothing to scan</strong><p>Paste a message, number, payment request or website first.</p>";

    return;
  }


  const words = [

    "otp",
    "password",
    "send money",
    "urgent",
    "activate",
    "winner",
    "investment",
    "guaranteed",
    "verify account",
    "blocked",
    "fee"

  ];


  const matches =
    words.filter(
      word =>
        input
          .toLowerCase()
          .includes(word)
    );


  result.classList.remove(
    "hidden"
  );


  if(matches.length >= 2){

    result.innerHTML = `

      <strong>
        🔴 HIGH RISK
      </strong>

      <p>
        MOVA detected several warning signals:
        ${matches.join(", ")}.
      </p>

      <p style="margin-top:8px">

        <b>
          Recommendation:
        </b>

        Do not send money or disclose
        PINs, passwords or OTPs until
        independently verified.

      </p>

    `;

  }

  else if(matches.length === 1){

    result.innerHTML = `

      <strong style="color:#d97706">
        🟡 BE CAREFUL
      </strong>

      <p>
        Potential warning sign detected:
        <b>${matches[0]}</b>.
        Verify the sender independently.
      </p>

    `;

  }

  else{

    result.innerHTML = `

      <strong style="color:#16a34a">
        🟢 NO OBVIOUS RED FLAGS
      </strong>

      <p>
        MOVA did not detect common scam
        patterns. This is not a guarantee
        of legitimacy.
      </p>

    `;

  }

}


/* MOVA PRICE */

function searchPrice(){

  const input =
    document
      .getElementById("priceInput")
      .value
      .trim();


  const results =
    document.getElementById(
      "priceResults"
    );


  if(!input){

    results.innerHTML = `

      <div class="empty-state">

        <span>⌕</span>

        <h3>
          Enter a product
        </h3>

        <p>
          Search for something you want to buy.
        </p>

      </div>

    `;

    return;
  }


  results.innerHTML = `

    <div class="price-result">

      <div class="price-result-header">

        <div>

          <span class="label">
            DEMO RESULT
          </span>

          <h3>
            ${escapeHTML(input)}
          </h3>

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
        margin-top:15px
      ">

        Demo data — connect the real
        merchant/community price database
        before launch.

      </p>

    </div>

  `;

}


/* GOALS */

function createGoal(){

  const name =
    document
      .getElementById("goalName")
      .value
      .trim();


  const target =
    Number(
      document
        .getElementById("goalTarget")
        .value
    );


  const current =
    Number(
      document
        .getElementById("goalCurrent")
        .value
    ) || 0;


  const deadline =
    document
      .getElementById("goalDeadline")
      .value;


  if(!name || !target){

    alert(
      "Enter a goal name and target amount."
    );

    return;
  }


  const data = getData();


  data.goals.push({

    name,
    target,
    current,
    deadline

  });


  saveData(data);


  [
    "goalName",
    "goalTarget",
    "goalCurrent",
    "goalDeadline"
  ]
  .forEach(
    id =>
      document.getElementById(id).value = ""
  );


  renderGoals();

}


function renderGoals(){

  const data = getData();


  document.getElementById(
    "goalsGrid"
  ).innerHTML =

    data.goals.map(goal => {

      const percentage =
        Math.min(
          100,
          Math.round(
            (goal.current /
              goal.target) *
            100
          )
        );


      return `

        <div class="goal-card">

          <div class="goal-top">

            <span>
              ${escapeHTML(
                goal.name
              )}
            </span>

            <strong>
              ${percentage}%
            </strong>

          </div>


          <div class="progress">

            <div
              style="width:${percentage}%">
            </div>

          </div>


          <div class="goal-bottom">

            <span>
              $${goal.current} saved
            </span>

            <span>
              Target $${goal.target}
            </span>

          </div>


          <p style="
            color:#667085;
            font-size:10px;
            margin-top:10px
          ">

            Deadline:
            ${goal.deadline || "Not set"}

          </p>

        </div>

      `;

    }).join("");

}


/* DEBTS */

function createDebt(){

  const name =
    document
      .getElementById("debtName")
      .value
      .trim();


  const balance =
    Number(
      document
        .getElementById("debtBalance")
        .value
    );


  const interest =
    Number(
      document
        .getElementById("debtInterest")
        .value
    ) || 0;


  const payment =
    Number(
      document
        .getElementById("debtPayment")
        .value
    ) || 0;


  if(!name || !balance){

    alert(
      "Enter a debt name and balance."
    );

    return;
  }


  const data = getData();


  data.debts.push({

    name,
    balance,
    interest,
    payment

  });


  saveData(data);


  [
    "debtName",
    "debtBalance",
    "debtInterest",
    "debtPayment"
  ]
  .forEach(
    id =>
      document.getElementById(id).value = ""
  );


  renderDebts();

}


function renderDebts(){

  const data = getData();

  const grid =
    document.getElementById(
      "debtGrid"
    );


  if(!data.debts.length){

    grid.innerHTML = `

      <div class="empty-state">

        <span>✓</span>

        <h3>
          No debts recorded
        </h3>

        <p>
          When you add a debt, MOVA will
          track balance, interest and payment.
        </p>

      </div>

    `;

    return;

  }


  grid.innerHTML =

    data.debts.map(debt => `

      <div class="debt-card">

        <span class="label">
          DEBT
        </span>

        <h3>
          ${escapeHTML(
            debt.name
          )}
        </h3>

        <div class="debt-amount">
          $${Number(
            debt.balance
          ).toFixed(2)}
        </div>

        <p>
          Interest: ${debt.interest}%
        </p>

        <p>
          Payment: $${Number(
            debt.payment
          ).toFixed(2)}
        </p>

      </div>

    `).join("");

}


/* TRANSACTIONS */

function addTransaction(){

  const type =
    document.getElementById(
      "txType"
    ).value;


  const amount =
    Number(
      document.getElementById(
        "txAmount"
      ).value
    );


  const category =
    document.getElementById(
      "txCategory"
    ).value
    .trim();


  const date =
    document.getElementById(
      "txDate"
    ).value ||
    new Date()
      .toISOString()
      .slice(0,10);


  const description =
    document.getElementById(
      "txDescription"
    ).value
    .trim();


  if(!amount || !category){

    alert(
      "Enter amount and category."
    );

    return;
  }


  const data = getData();


  data.transactions.unshift({

    type,
    amount,
    category,
    date,

    description:
      description || category

  });


  saveData(data);


  [
    "txAmount",
    "txCategory",
    "txDate",
    "txDescription"
  ]
  .forEach(
    id =>
      document.getElementById(id).value = ""
  );


  renderTransactions();

  renderDashboard();

}


function renderTransactions(){

  const data = getData();


  document.getElementById(
    "allTransactions"
  ).innerHTML =

    data.transactions
      .map(transactionHTML)
      .join("");

}


/* PROFILE */

function saveProfile(){

  const data = getData();


  data.profile = {

    income:
      Number(
        document.getElementById(
          "profileIncome"
        ).value
      ) || 0,

    expenses:
      Number(
        document.getElementById(
          "profileExpenses"
        ).value
      ) || 0,

    savings:
      Number(
        document.getElementById(
          "profileSavings"
        ).value
      ) || 0,

    currency:
      document.getElementById(
        "profileCurrency"
      ).value

  };


  saveData(data);

  renderDashboard();

  renderIntelligence();


  alert(
    "Financial profile saved."
  );

}


function loadProfile(){

  const profile =
    getData().profile;


  document.getElementById(
    "profileIncome"
  ).value =
    profile.income || "";


  document.getElementById(
    "profileExpenses"
  ).value =
    profile.expenses || "";


  document.getElementById(
    "profileSavings"
  ).value =
    profile.savings || "";


  document.getElementById(
    "profileCurrency"
  ).value =
    profile.currency || "USD";

}


/* AI COACH */

function handleChat(event){

  if(event.key === "Enter")
    sendMessage();

}


function sendMessage(){

  const input =
    document.getElementById(
      "chatInput"
    );


  const message =
    input.value.trim();


  if(!message)
    return;


  const chat =
    document.getElementById(
      "chatWindow"
    );


  chat.innerHTML += `

    <div class="message user">

      <div>

        <p>
          ${escapeHTML(message)}
        </p>

      </div>

    </div>

  `;


  input.value = "";


  setTimeout(() => {

    const data = getData();

    const profile =
      data.profile;


    const answer = `

      Based on your current MOVA profile,
      your monthly income is
      $${Number(
        profile.income || 0
      ).toFixed(0)},

      monthly expenses are
      $${Number(
        profile.expenses || 0
      ).toFixed(0)},

      and savings are
      $${Number(
        profile.savings || 0
      ).toFixed(0)}.

      I would use those numbers before
      recommending a purchase or financial decision.

    `;


    chat.innerHTML += `

      <div class="message ai">

        <div class="message-avatar">
          M
        </div>

        <div>

          <strong>
            MOVA
          </strong>

          <p>
            ${answer}
          </p>

        </div>

      </div>

    `;


    chat.scrollTop =
      chat.scrollHeight;

  },450);

}


/* NOTIFICATIONS */

function showNotification(){

  alert(
    "MOVA: Your financial intelligence score has been updated."
  );

}


/* SECURITY */

function escapeHTML(value){

  return String(value).replace(
    /[&<>"']/g,

    character => ({

      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"

    })[character]

  );

}


/* START */

function renderAll(){

  const now = new Date();


  document.getElementById(
    "dateLabel"
  ).textContent =

    now
      .toLocaleDateString(
        "en-US",
        {
          weekday:"long",
          month:"long",
          day:"numeric"
        }
      )
      .toUpperCase();


  updateAccountUI();

  loadProfile();

  renderDashboard();

  renderIntelligence();

  renderGoals();

  renderDebts();

  renderTransactions();

  enforceTrial();

}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const account =
      getAccount();


    if(account){

      launchApp();

    }

    else{

      document
        .getElementById("authScreen")
        .classList.remove("hidden");

    }

  }
);
