# Firebase setup

1. In the `ustad-app-c1bde` Firebase project, enable Google as an Authentication
   sign-in provider and create the Cloud Firestore database.
2. Install the Cloud Function dependencies with
   `npm install --prefix functions`.
3. Deploy the balance security rules and approval functions with
   `firebase deploy --only firestore:rules,functions`.
4. To grant review access, set the `admin: true` custom claim for a trusted
   reviewer using the Firebase Admin SDK from a trusted environment. Preserve
   any existing claims when doing so. Never expose a claim-granting endpoint
   or Admin SDK credentials to the browser.
5. A reviewer signs in with that account to see the in-app pending payment
   queue. Approving a request credits tokens through the callable function;
   rejection does not change balances. Add-on approval also checks the user's
   target-month base subscription in the function transaction.

The browser Firebase configuration is project identification, not an
authorization boundary. Firestore rules deny client-side positive balance
changes and payment-request status changes. Deploy the rules before enabling
real payments.
