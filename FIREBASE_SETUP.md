# Firebase setup

1. In the `ustad-app-c1bde` Firebase project, enable Google as an Authentication
   sign-in provider and create the Cloud Firestore database.
2. Deploy the Firestore security rules with
   `firebase deploy --only firestore:rules`.
3. Sign in as an administrator, open `/admin`, and use **Seed Grade 8 Science
   Lessons to Firestore** to upload the bundled lesson index. Lesson-index
   reads are public and writes require an authenticated account.
4. The verified Google account `sirwaqarishaq@gmail.com` is authorized as an
   administrator by the Firestore rules. Alternatively, grant the `admin:
   true` custom claim to another trusted reviewer using the Firebase Admin SDK
   from a trusted environment. Preserve any existing claims when doing so.
   Never expose a claim-granting endpoint or Admin SDK credentials to the
   browser.
5. A reviewer signs in with that account to see the in-app pending payment
   queue. Approval atomically updates the request, monthly balance,
   subscription (for base plans), and transaction receipt in a Firestore
   transaction. Rejection does not change balances. Firestore rules require
   the admin claim, a pending request, valid plan amounts, and an active
   target-month subscription for add-on approvals.

The browser Firebase configuration is project identification, not an
authorization boundary. Firestore rules deny client-side positive balance
changes except for a valid admin approval transaction, and deny payment-request
status changes except for admin approval or rejection. Deploy the rules before
enabling real payments.
