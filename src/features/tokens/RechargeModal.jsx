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
} from "../../utils/monthUtils.js";
import { PLANS } from "./plans.js";

const paymentNumber = "03469140009";
const basePlans = PLANS.filter((plan) => plan.id !== "addon").map((plan) => ({ ...plan, isAddon: false }));
const addonPlan = { ...PLANS.find((plan) => plan.id === "addon"), isAddon: true };

function monthLabel(monthKey) {
  return new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function RechargeModal({
  isOpen,
  onClose,
  initialPlanId = "basic",
  onSubmitted,
}) {
  const { currentUser, hasBasePlan } = useUser();
  const selectedMonth = getCurrentMonthKey();
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
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
    setSelectedPlanId(initialPlanId);
    setError("");
  }, [initialPlanId, isOpen]);

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
    if (selectedMonth !== getCurrentMonthKey()) {
      setError("Choose the current monthly plan.");
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
      className="ustad-recharge-overlay fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="recharge-title"
        aria-modal="true"
        className="ustad-recharge-panel max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium">Add tokens</p>
            <h2
              className="text-xl font-semibold tracking-tight sm:text-2xl"
              id="recharge-title"
            >
              Recharge your balance
            </h2>
          </div>
          <button
            aria-label="Close recharge dialog"
            className="ustad-recharge-close grid min-h-11 min-w-11 place-items-center rounded-xl text-2xl leading-none"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="ustad-recharge-info rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-medium">Payment method</p>
          <p className="mt-1 text-lg font-semibold">EasyPaisa</p>
          <p className="mt-2 text-sm">
            Account title: <strong>Waqar Ishaq</strong>
          </p>
          <p className="mt-1 text-sm">
            Account number:{" "}
            <strong className="tracking-wide">{paymentNumber}</strong>
          </p>
          <button
            className="ustad-recharge-copy mt-4 min-h-11 rounded-xl px-4 py-2 text-sm font-semibold"
            onClick={copyPaymentNumber}
            type="button"
          >
            Copy Number
          </button>
          {copyMessage && (
            <span aria-live="polite" className="ml-3 text-sm">
              {copyMessage}
            </span>
          )}
        </div>

        <form className="mt-5 space-y-5" onSubmit={submitPayment}>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Choose a plan for {monthLabel(selectedMonth)}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`ustad-recharge-plan min-h-20 rounded-2xl border p-4 text-left transition focus:outline-none ${
                      isSelected
                        ? "is-selected"
                        : ""
                    }`}
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setError("");
                    }}
                    type="button"
                  >
                    <span className="font-semibold">
                      {plan.isAddon ? "Add-on" : `${plan.name} Plan`}
                    </span>
                    <span className="mt-1 block text-sm">
                      Rs {plan.price} · {plan.tokens.toLocaleString()} Tokens
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="ustad-recharge-label grid gap-2 text-sm font-medium">
              EasyPaisa Sender Number
              <input
                autoComplete="tel"
                className="ustad-recharge-input min-h-12 rounded-xl border px-3 text-base outline-none"
                inputMode="numeric"
                maxLength={11}
                onChange={(event) => setSenderPhone(event.target.value)}
                pattern="[0-9]{11}"
                placeholder="03001234567"
                required
                value={senderPhone}
              />
            </label>
            <label className="ustad-recharge-label grid gap-2 text-sm font-medium">
              Transaction ID / TID
              <input
                className="ustad-recharge-input min-h-12 rounded-xl border px-3 text-base uppercase outline-none"
                maxLength={11}
                onChange={(event) => setTid(event.target.value)}
                placeholder="12345678901"
                required
                value={tid}
              />
            </label>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
          <button
            className="ustad-button ustad-recharge-submit min-h-12 w-full rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
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
