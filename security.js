/* ============================================================
   MOVA SECURITY LAYER
   Browser-side security helpers
   ============================================================

   IMPORTANT:
   This file does NOT replace Supabase RLS.

   Database security:
       supabase/migrations/security.sql

   Browser security:
       security.js

   Sensitive secrets must NEVER be stored here.
   ============================================================ */

"use strict";


/* ============================================================
   MOVA SECURITY NAMESPACE
   ============================================================ */

window.MOVASecurity = {

  /* ==========================================================
     AUTHENTICATION CHECK
     ========================================================== */

  isAuthenticated() {

    try {

      return !!window.currentUser;

    } catch (error) {

      console.error(
        "MOVA security authentication check failed:",
        error
      );

      return false;

    }

  },


  /* ==========================================================
     REQUIRE AUTHENTICATION
     ========================================================== */

  requireAuthentication() {

    if (!this.isAuthenticated()) {

      console.warn(
        "MOVA blocked an action because the user is not authenticated."
      );

      if (
        typeof showAuthScreen === "function"
      ) {

        showAuthScreen();

      }

      return false;

    }

    return true;

  },


  /* ==========================================================
     VALIDATE MONEY AMOUNT
     ========================================================== */

  validateAmount(value) {

    const amount =
      Number(value);


    if (!Number.isFinite(amount)) {

      return {
        valid: false,
        message: "Amount must be a valid number."
      };

    }


    if (amount <= 0) {

      return {
        valid: false,
        message: "Amount must be greater than zero."
      };

    }


    if (amount > 1000000000) {

      return {
        valid: false,
        message: "Amount is outside the allowed range."
      };

    }


    return {
      valid: true,
      value: Math.round(amount * 100) / 100
    };

  },


  /* ==========================================================
     VALIDATE TEXT
     ========================================================== */

  validateText(
    value,
    fieldName = "Text",
    maxLength = 500
  ) {

    const text =
      String(value ?? "")
        .trim();


    if (!text) {

      return {
        valid: false,
        message: `${fieldName} cannot be empty.`
      };

    }


    if (text.length > maxLength) {

      return {
        valid: false,
        message:
          `${fieldName} cannot exceed ${maxLength} characters.`
      };

    }


    return {
      valid: true,
      value: text
    };

  },


  /* ==========================================================
     VALIDATE EMAIL
     ========================================================== */

  validateEmail(email) {

    const value =
      String(email ?? "")
        .trim()
        .toLowerCase();


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(value)) {

      return {
        valid: false,
        message: "Enter a valid email address."
      };

    }


    return {
      valid: true,
      value
    };

  },


  /* ==========================================================
     SANITIZE TEXT
     ========================================================== */

  sanitizeText(value) {

    return String(value ?? "")
      .replace(/[<>]/g, "")
      .trim();

  },


  /* ==========================================================
     SAFE HTML ESCAPING
     ========================================================== */

  escapeHTML(value) {

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

  },


  /* ==========================================================
     PASSWORD CHECK
     ========================================================== */

  validatePassword(password) {

    const value =
      String(password ?? "");


    if (value.length < 8) {

      return {
        valid: false,
        message:
          "Password must contain at least 8 characters."
      };

    }


    return {
      valid: true
    };

  },


  /* ==========================================================
     DATE VALIDATION
     ========================================================== */

  validateDate(date) {

    if (!date) {

      return {
        valid: false,
        message: "Please select a date."
      };

    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return {
        valid: false,
        message: "Invalid date."
      };

    }


    return {
      valid: true
    };

  },


  /* ==========================================================
     SECURITY LOG
     ========================================================== */

  logSecurityEvent(
    eventName,
    details = {}
  ) {

    console.info(
      "[MOVA SECURITY]",
      eventName,
      details
    );

  }

};


console.log(
  "MOVA Security Layer loaded."
);