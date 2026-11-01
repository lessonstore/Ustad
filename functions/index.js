const { getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const plans = {
  basic: { type: "base", tokens: 50 },
  standard: { type: "base", tokens: 110 },
  pro: { type: "base", tokens: 170 },
  addon: { type: "addon", tokens: 15 },
};

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date) {
  const previous = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1),
  );
  return monthKey(previous);
}

function validateTargetMonth(targetMonth) {
  if (
    typeof targetMonth !== "string" ||
    !monthPattern.test(targetMonth) ||
    ![monthKey(new Date()), previousMonthKey(new Date())].includes(targetMonth)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The payment target must be the current or previous calendar month.",
    );
  }
}

function requireAdmin(request) {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
}

function requireRequestId(requestId) {
  if (typeof requestId !== "string" || requestId.length === 0) {
    throw new HttpsError("invalid-argument", "A payment request ID is required.");
  }
}

exports.approvePaymentRequest = onCall(async (request) => {
  requireAdmin(request);
  const { requestId } = request.data ?? {};
  requireRequestId(requestId);

  return db.runTransaction(async (transaction) => {
    const requestRef = db.collection("payment_requests").doc(requestId);
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) {
      throw new HttpsError("not-found", "Payment request was not found.");
    }
    const payment = requestSnapshot.data();
    if (payment.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "This payment request has already been reviewed.",
      );
    }

    validateTargetMonth(payment.targetMonth);
    const plan = plans[payment.planId];
    if (!plan || plan.type !== payment.type) {
      throw new HttpsError("invalid-argument", "The requested plan is invalid.");
    }
    if (payment.tokenAmount !== plan.tokens) {
      throw new HttpsError("invalid-argument", "The token amount is invalid.");
    }
    if (
      typeof payment.senderPhone !== "string" ||
      !/^\d{11}$/.test(payment.senderPhone) ||
      typeof payment.tid !== "string" ||
      !/^[A-Z0-9]{11}$/.test(payment.tid) ||
      payment.tid !== payment.tid.trim().toUpperCase()
    ) {
      throw new HttpsError("invalid-argument", "The payment details are invalid.");
    }

    const userRef = db.collection("users").doc(payment.userId);
    const receiptRef = db.collection("payment_receipts").doc(payment.tid);
    const userSnapshot = await transaction.get(userRef);
    const receiptSnapshot = await transaction.get(receiptRef);
    if (!userSnapshot.exists) {
      throw new HttpsError("not-found", "The purchaser account was not found.");
    }
    if (receiptSnapshot.exists) {
      throw new HttpsError(
        "already-exists",
        "This transaction ID has already been approved.",
      );
    }
    const user = userSnapshot.data();

    if (
      plan.type === "addon" &&
      user.subscriptions?.[payment.targetMonth]?.active !== true
    ) {
      throw new HttpsError(
        "failed-precondition",
        "An active base subscription is required for add-on tokens.",
      );
    }

    transaction.update(userRef, {
      [`tokens.${payment.targetMonth}`]: FieldValue.increment(plan.tokens),
      ...(plan.type === "base"
        ? {
            [`subscriptions.${payment.targetMonth}`]: {
              active: true,
              planId: payment.planId,
              updatedAt: FieldValue.serverTimestamp(),
            },
          }
        : {}),
    });
    transaction.update(requestRef, {
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: request.auth.uid,
    });
    transaction.create(receiptRef, {
      paymentRequestId: requestId,
      userId: payment.userId,
      approvedBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
});

exports.rejectPaymentRequest = onCall(async (request) => {
  requireAdmin(request);
  const { requestId } = request.data ?? {};
  requireRequestId(requestId);

  return db.runTransaction(async (transaction) => {
    const requestRef = db.collection("payment_requests").doc(requestId);
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) {
      throw new HttpsError("not-found", "Payment request was not found.");
    }
    if (requestSnapshot.data().status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "This payment request has already been reviewed.",
      );
    }
    transaction.update(requestRef, {
      status: "rejected",
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedBy: request.auth.uid,
    });
    return { success: true };
  });
});
