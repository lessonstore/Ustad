import { useEffect, useState } from "react";
import {
  collection,
  db,
  functions,
  httpsCallable,
  onSnapshot,
  query,
  where,
} from "../../services/firebase.js";

export default function AdminPaymentQueue() {
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
      const reviewPayment = httpsCallable(functions, action);
      await reviewPayment({ requestId });
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
                  onClick={() => reviewRequest(payment.id, "approvePaymentRequest")}
                  type="button"
                >
                  {busyRequestId === payment.id ? "Processing…" : "Approve"}
                </button>
                <button
                  className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  disabled={Boolean(busyRequestId)}
                  onClick={() => reviewRequest(payment.id, "rejectPaymentRequest")}
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
