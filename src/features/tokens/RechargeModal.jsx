import { useState } from "react";

const paymentNumber = "03469140009";

const plans = [
  { id: "basic", name: "Basic Plan", price: 150, tokens: 50 },
  { id: "standard", name: "Standard Plan", price: 300, tokens: 110 },
  { id: "pro", name: "Pro Plan", price: 450, tokens: 170 },
  { id: "addon", name: "Add-on Pack", price: 50, tokens: 15 },
];

export default function RechargeModal({ onClose, onSimulateRecharge }) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedPlan = plans.find(({ id }) => id === selectedPlanId);

  async function copyPaymentNumber() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(paymentNumber);
      setCopyMessage("Number copied.");
    } catch (copyError) {
      console.error("Could not copy the EasyPaisa number:", copyError);
      setCopyMessage("Could not copy. Please copy the number manually.");
    }
  }

  function submitPayment(event) {
    event.preventDefault();

    if (!selectedPlan) {
      setError("Select a plan before submitting your payment.");
      return;
    }
    if (!/^\d{11}$/.test(senderNumber)) {
      setError("Enter your 11-digit EasyPaisa sender number.");
      return;
    }
    if (!/^\d{11}$/.test(transactionId)) {
      setError("Enter the 11-digit Transaction ID from your SMS.");
      return;
    }

    setError("");
    setSubmitted(true);
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
            <p className="mb-1 text-sm font-medium text-indigo-600">
              Add tokens
            </p>
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Payment method
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                EasyPaisa
              </p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="text-emerald-800">
                Account title:{" "}
                <span className="font-semibold text-emerald-950">
                  Waqar Ishaq
                </span>
              </p>
              <p className="mt-1 text-emerald-800">
                Account number:{" "}
                <span className="font-semibold tracking-wide text-emerald-950">
                  {paymentNumber}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              onClick={copyPaymentNumber}
              type="button"
            >
              Copy Number
            </button>
            {copyMessage && (
              <span aria-live="polite" className="text-sm text-emerald-900">
                {copyMessage}
              </span>
            )}
          </div>
        </div>

        <ol className="my-5 space-y-3 text-sm leading-6 text-slate-600">
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              1
            </span>
            <span>
              Open EasyPaisa and send the exact amount for your chosen plan to{" "}
              <span className="font-semibold text-slate-900">
                {paymentNumber}
              </span>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              2
            </span>
            <span>Select your purchased plan below.</span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              3
            </span>
            <span>
              Enter the 11-digit Transaction ID (TID) from your EasyPaisa
              confirmation SMS and your sending phone number.
            </span>
          </li>
        </ol>

        {submitted ? (
          <div
            aria-live="polite"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
            role="status"
          >
            <h3 className="font-semibold text-emerald-900">
              Payment submitted!
            </h3>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Your tokens will be credited after verification.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={submitPayment}>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-slate-800">
                Choose a plan
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
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {plan.name}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-semibold text-indigo-700">
                            Selected
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        RS {plan.price} · {plan.tokens} Tokens
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
                  onChange={(event) => setSenderNumber(event.target.value)}
                  pattern="[0-9]{11}"
                  placeholder="03001234567"
                  required
                  title="Enter an 11-digit phone number."
                  value={senderNumber}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Transaction ID / TID
                <input
                  className="min-h-12 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(event) => setTransactionId(event.target.value)}
                  pattern="[0-9]{11}"
                  placeholder="12345678901"
                  required
                  title="Enter the 11-digit Transaction ID."
                  value={transactionId}
                />
              </label>
            </div>

            {error && (
              <p className="text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}

            <button
              className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              type="submit"
            >
              Submit Payment for Verification
            </button>
          </form>
        )}

        {import.meta.env.DEV && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm leading-5 text-slate-600">
              Development testing only. Simulate a recharge to test lesson
              unlocking without payment verification.
            </p>
            <button
              className="mt-3 min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedPlan}
              onClick={() => {
                onSimulateRecharge(selectedPlan.tokens);
                onClose();
              }}
              type="button"
            >
              Simulate Recharge
              {selectedPlan ? ` · ${selectedPlan.tokens} Tokens` : ""}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
