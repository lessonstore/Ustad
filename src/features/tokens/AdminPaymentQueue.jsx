import { useEffect, useState } from "react";
import {
  collection,
  db,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "../../services/firebase.js";
import { useUser } from "../../context/UserContext.jsx";
import { isMonthInActiveWindow } from "../../utils/monthUtils.js";

const plans = {
  basic: { type: "base", tokens: 50 },
  standard: { type: "base", tokens: 110 },
  pro: { type: "base", tokens: 170 },
  addon: { type: "addon", tokens: 15 },
};

export default function AdminPaymentQueue() {
  const { currentUser, isAdmin } = useUser();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busyRequestId, setBusyRequestId] = useState("");

  useEffect(() => {
    const pendingQuery = query(
      collection(db, "payment_requests"),
      where("status", "==", "pending"),
    );
    return onSnapshot(
      pendingQuery,
      (snapshot) => {
        setRequests(
          snapshot.docs
            .map((paymentRequest) => ({
              id: paymentRequest.id,
              ...paymentRequest.data(),
            }))
            .sort(
              (first, second) =>
                (first.createdAt?.toMillis() ?? 0) -
                (second.createdAt?.toMillis() ?? 0),
            ),
        );
        setError("");
      },
      (snapshotError) => {
        console.error("Could not load pending payment requests:", snapshotError);
        setError("Could not load pending payment requests.");
      },
    );
  }, []);

  async function reviewRequest(requestId, action) {
    setBusyRequestId(requestId);
    setError("");
    try {
      if (!currentUser || !isAdmin) {
        throw new Error("Administrator access is required.");
      }

      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "payment_requests", requestId);
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists()) {
          throw new Error("Payment request was not found.");
        }

        const payment = requestSnapshot.data();
        if (payment.status !== "pending") {
          throw new Error("This payment request has already been reviewed.");
        }

        if (action === "reject") {
          transaction.update(requestRef, {
            status: "rejected",
            rejectedAt: serverTimestamp(),
            rejectedBy: currentUser.uid,
          });
          return;
        }

        const plan = plans[payment.planId];
        if (
          !plan ||
          payment.type !== plan.type ||
          payment.tokenAmount !== plan.tokens ||
          !payment.userId ||
          !isMonthInActiveWindow(payment.targetMonth)
        ) {
          throw new Error("The payment request details are invalid.");
        }

        const userRef = doc(db, "users", payment.userId);
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists()) {
          throw new Error("The purchaser account was not found.");
        }

        const user = userSnapshot.data();
        if (
          plan.type === "addon" &&
          user.subscriptions?.[payment.targetMonth]?.active !== true
        ) {
          throw new Error(
            "An active base subscription is required for add-on tokens.",
          );
        }

        const receiptRef = doc(db, "payment_receipts", payment.tid);
        const receiptSnapshot = await transaction.get(receiptRef);
        if (receiptSnapshot.exists()) {
          throw new Error("This transaction ID has already been approved.");
        }

        const userUpdate = {
          [`tokens.${payment.targetMonth}`]: increment(plan.tokens),
          lastPaymentRequestId: requestId,
        };
        if (plan.type === "base") {
          userUpdate[`subscriptions.${payment.targetMonth}`] = {
            planId: payment.planId,
            active: true,
            activatedAt: serverTimestamp(),
          };
        }

        transaction.update(userRef, userUpdate);
        transaction.update(requestRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
          approvedBy: currentUser.uid,
        });
        transaction.set(receiptRef, {
          paymentRequestId: requestId,
          userId: payment.userId,
          approvedBy: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      });
    } catch (reviewError) {
      console.error(`Could not ${action} payment request:`, reviewError);
      setError(
        reviewError.message || "Could not review this payment request.",
      );
    } finally {
      setBusyRequestId("");
    }
  }

  return (
    <section
      aria-labelledby="admin-payment-queue"
      className="mb-8 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2
        className="text-lg font-semibold text-slate-900"
        id="admin-payment-queue"
      >
        Pending payment requests
      </h2>
      {error && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      {!requests.length ? (
        <p className="mt-3 text-sm text-slate-600">
          There are no pending payment requests.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {requests.map((payment) => (
            <li
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={payment.id}
            >
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  {payment.userEmail || payment.userId}
                </p>
                <p>
                  {payment.planId} · {payment.tokenAmount} tokens ·{" "}
                  {payment.targetMonth}
                </p>
                <p>
                  Sender {payment.senderPhone} · TID {payment.tid}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="min-h-10 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={Boolean(busyRequestId)}
                  onClick={() => reviewRequest(payment.id, "approve")}
                  type="button"
                >
                  {busyRequestId === payment.id ? "Processing…" : "Approve"}
                </button>
                <button
                  className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  disabled={Boolean(busyRequestId)}
                  onClick={() => reviewRequest(payment.id, "reject")}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
