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
  writeBatch,
} from "../../services/firebase.js";
import grade8ScienceIndex from "../../data/grade8ScienceIndex.json";
import { useUser } from "../../context/UserContext.jsx";
import { isMonthInActiveWindow } from "../../utils/monthUtils.js";

const plans = {
  basic: { type: "base", tokens: 500 },
  standard: { type: "base", tokens: 1100 },
  pro: { type: "base", tokens: 1700 },
  addon: { type: "addon", tokens: 150 },
};

export default function AdminPaymentQueue() {
  const { currentUser, isAdmin } = useUser();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [busyRequestId, setBusyRequestId] = useState("");
  const [seedingLessons, setSeedingLessons] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [seedError, setSeedError] = useState("");

  useEffect(() => {
    const pendingQuery = query(
      collection(db, "payment_requests"),
      where("status", "==", status),
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
                (second.createdAt?.toMillis() ?? 0) -
                (first.createdAt?.toMillis() ?? 0),
            ),
        );
        setError("");
      },
      (snapshotError) => {
        console.error("Could not load pending payment requests:", snapshotError);
        setError("Could not load pending payment requests.");
      },
    );
  }, [status]);

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

  async function seedScienceLessons() {
    setSeedingLessons(true);
    setSeedMessage("");
    setSeedError("");

    try {
      for (let start = 0; start < grade8ScienceIndex.length; start += 450) {
        const batch = writeBatch(db);
        const chunk = grade8ScienceIndex.slice(start, start + 450);
        for (const lesson of chunk) {
          batch.set(doc(db, "lesson_indexes", lesson.id), {
            id: lesson.id,
            bookId: lesson.bookId,
            lessonNumber: lesson.lessonNumber,
            chapterNumber: lesson.chapterNumber,
            chapterName: lesson.chapterName,
            topic: lesson.topic,
            homework: lesson.homework,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      setSeedMessage(
        `${grade8ScienceIndex.length} lessons successfully uploaded to Firestore!`,
      );
    } catch (seedError) {
      console.error("Could not seed Grade 8 science lessons:", seedError);
      setSeedError(
        seedError.message || "Could not upload Grade 8 science lessons.",
      );
    } finally {
      setSeedingLessons(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold">Payment requests</h1>
          <a className="rounded-xl border border-input px-4 py-2 text-sm font-semibold transition hover:bg-secondary" href="/">Back to Catalog</a>
        </header>
        <div className="mt-6 flex gap-2">
          {["pending", "approved", "rejected"].map((item) => (
            <button key={item} onClick={() => setStatus(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${status === item ? "bg-gradient-primary text-primary-foreground" : "border border-input hover:bg-secondary"}`} type="button">{item}</button>
          ))}
        </div>
        <section
          aria-labelledby="science-seed-title"
          className="mb-6 mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6"
        >
          <h2
            className="text-lg font-semibold"
            id="science-seed-title"
          >
            Admin tools
          </h2>
          <button
            className="mt-4 min-h-11 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition disabled:cursor-wait disabled:opacity-60"
            disabled={seedingLessons}
            onClick={() => void seedScienceLessons()}
            type="button"
          >
            {seedingLessons
              ? "Uploading Grade 8 science lessons…"
              : "Seed Grade 8 Science Lessons to Firestore"}
          </button>
          {seedMessage && (
            <p className="mt-3 text-sm text-primary" role="status">
              {seedMessage}
            </p>
          )}
          {seedError && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {seedError}
            </p>
          )}
        </section>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!requests.length ? (
        <p className="py-10 text-center text-muted-foreground">
          Nothing here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {requests.map((payment) => (
            <li
              className="animate-rise flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              key={payment.id}
            >
              <div className="text-sm">
                <p className="font-semibold">
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
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  hidden={status !== "pending"}
                  disabled={Boolean(busyRequestId)}
                  onClick={() => reviewRequest(payment.id, "approve")}
                  type="button"
                >
                  {busyRequestId === payment.id ? "Processing…" : "Approve"}
                </button>
                <button
                  className="rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50"
                  hidden={status !== "pending"}
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
      </div>
    </main>
  );
}
