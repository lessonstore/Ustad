import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  db,
  serverTimestamp,
} from "../../services/firebase.js";
import { useUser } from "../../context/UserContext.jsx";
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  isMonthInActiveWindow,
} from "../../utils/monthUtils.js";

const paymentNumber = "03469140009";
const basePlans = [
  { id: "basic", name: "Basic", price: 150, tokens: 50, isAddon: false },
  { id: "standard", name: "Standard", price: 300, tokens: 110, isAddon: false },
  { id: "pro", name: "Pro", price: 450, tokens: 170, isAddon: false },
];
const addonPlan = {
  id: "addon",
  name: "Add-on",
  price: 50,
  tokens: 15,
  isAddon: true,
};

function monthLabel(monthKey) {
  return new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function RechargeModal({
  isOpen,
  onClose,
  initialTargetMonth,
  onSubmitted,
}) {
  const { currentUser, hasBasePlan } = useUser();
  const [selectedMonth, setSelectedMonth] = useState(
    isMonthInActiveWindow(initialTargetMonth)
      ? initialTargetMonth
      : getCurrentMonthKey(),
  );
  const [selectedPlanId, setSelectedPlanId] = useState("basic");
  const [senderPhone, setSenderPhone] = useState("");
  const [tid, setTid] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addonEligible = hasBasePlan(selectedMonth);
  const plans = addonEligible ? [...basePlans, addonPlan] : basePlans;
  const selectedPlan = plans.find(({ id }) => id === selectedPlanId);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedMonth(
      isMonthInActiveWindow(initialTargetMonth)
        ? initialTargetMonth
        : getCurrentMonthKey(),
    );
    setSelectedPlanId("basic");
    setError("");
  }, [initialTargetMonth, isOpen]);

  useEffect(() => {
    if (!addonEligible && selectedPlanId === addonPlan.id) {
      setSelectedPlanId(basePlans[0].id);
    }
  }, [addonEligible, selectedPlanId]);

  if (!isOpen) return null;

  async function copyPaymentNumber() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard access is unavailable.");
      }
      await navigator.clipboard.writeText(paymentNumber);
      setCopyMessage("Number copied.");
    } catch (copyError) {
      console.error("Could not copy the payment number:", copyError);
      setCopyMessage("Could not copy. Please copy the number manually.");
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    const cleanPhone = senderPhone.trim();
    const cleanTid = tid.trim().toUpperCase();
    if (!currentUser) {
      setError("Sign in before submitting a payment request.");
      return;
    }
    if (!selectedPlan) {
      setError("Select an available plan before submitting your payment.");
      return;
    }
    if (!/^\d{11}$/.test(cleanPhone)) {
      setError("Enter your 11-digit EasyPaisa sender number.");
      return;
    }
    if (!/^[A-Z0-9]{11}$/.test(cleanTid)) {
      setError("Enter the 11-character Transaction ID from your SMS.");
      return;
    }
    if (!isMonthInActiveWindow(selectedMonth)) {
      setError("Choose the current month or previous month.");
      return;
    }
    if (selectedPlan.isAddon && !hasBasePlan(selectedMonth)) {
      setError("An active base plan is required for add-on tokens.");
      setSelectedPlanId(basePlans[0].id);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        type: selectedPlan.isAddon ? "addon" : "base",
        planId: selectedPlan.id,
        tokenAmount: selectedPlan.tokens,
        targetMonth: selectedMonth,
        senderPhone: cleanPhone,
        tid: cleanTid,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      onSubmitted?.();
      onClose();
    } catch (submitError) {
      console.error("Could not submit the payment request:", submitError);
      setError("Could not submit your payment request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="recharge-title"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-indigo-600">Add tokens</p>
            <h2
              className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              id="recharge-title"
            >
              Recharge your balance
            </h2>
          </div>
          <button
            aria-label="Close recharge dialog"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-emerald-800">Payment method</p>
          <p className="mt-1 text-lg font-semibold text-emerald-950">EasyPaisa</p>
          <p className="mt-2 text-sm text-emerald-800">
            Account title: <strong className="text-emerald-950">Waqar Ishaq</strong>
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Account number:{" "}
            <strong className="tracking-wide text-emerald-950">{paymentNumber}</strong>
          </p>
          <button
            className="mt-4 min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            onClick={copyPaymentNumber}
            type="button"
          >
            Copy Number
          </button>
          {copyMessage && (
            <span aria-live="polite" className="ml-3 text-sm text-emerald-900">
              {copyMessage}
            </span>
          )}
        </div>

        <form className="mt-5 space-y-5" onSubmit={submitPayment}>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">
              Choose a target month
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[getCurrentMonthKey(), getPreviousMonthKey()].map((monthKey) => (
                <button
                  aria-pressed={selectedMonth === monthKey}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-medium ${
                    selectedMonth === monthKey
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                  key={monthKey}
                  onClick={() => setSelectedMonth(monthKey)}
                  type="button"
                >
                  {monthLabel(monthKey)}
                  {monthKey === getCurrentMonthKey() ? " · Current" : " · Catch-up"}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">
              Choose a plan for {monthLabel(selectedMonth)}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`min-h-20 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setError("");
                    }}
                    type="button"
                  >
                    <span className="font-semibold text-slate-900">
                      {plan.isAddon ? "Add-on" : `${plan.name} Plan`}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">
                      Rs {plan.price} · {plan.tokens} Tokens
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              EasyPaisa Sender Number
              <input
                autoComplete="tel"
                className="min-h-12 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                inputMode="numeric"
                maxLength={11}
                onChange={(event) => setSenderPhone(event.target.value)}
                pattern="[0-9]{11}"
                placeholder="03001234567"
                required
                value={senderPhone}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Transaction ID / TID
              <input
                className="min-h-12 rounded-xl border border-slate-300 px-3 text-base uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                maxLength={11}
                onChange={(event) => setTid(event.target.value)}
                placeholder="12345678901"
                required
                value={tid}
              />
            </label>
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}
          <button
            className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting || !selectedPlan}
            type="submit"
          >
            {submitting ? "Submitting…" : "Submit Payment for Verification"}
          </button>
        </form>
      </section>
    </div>
  );
}
