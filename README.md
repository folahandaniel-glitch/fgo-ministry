# Fodan Gospel Outreach — Ministry Website

A multi-page website for FGO, wired to Firebase (Firestore) so that
registrations, sermons, events, testimonies, and giving all persist for
real, regardless of where the site is hosted.

## What's included

- **Home, About, Wings, Sermons, Events, Give, Testimonies, Register, Contact** — public pages
- **Admin panel** (`admin.html`) — login, member/welfare list, sermon publishing,
  event creation with ticketing, testimony moderation, giving overview,
  Paystack setup, About page content editor, and admin account management
- **Firestore as the database** — works from any hosting, not just inside Claude
- **Paystack integration** for online giving and paid event tickets
- **Tentative wing logos** (SVG) for CROP, OLDV, TMII, TSM, TSAM, KAP — TLYI uses
  the real logo you provided. Replace any of these anytime by editing
  `js/wings-data.js`.

**Not included yet, on purpose:** Bible School (courses/exams), Trivia, the
Forum, and Pastor branch reporting. Those were real features in the earlier
single-file app; they can be added to this proper multi-page structure in a
follow-up pass now that the Firebase foundation is solid.

## Before you deploy: create the Super Admin

Go to `/admin.html` and sign in with the email **folahandaniel@gmail.com**
(hardcoded as `DESIGNATED_SUPER_ADMIN_EMAIL` in `js/admin.js`) and whatever
password you want, at least 6 characters, a Firebase requirement. That first
sign-in creates the real Firebase Authentication account and the matching
Super Admin record. No one else can claim this, since Firestore's rules
check that the signed-in Firebase Auth email itself matches this exact
address, not just a value someone typed into a form.

Do this before sharing the site publicly, and before anyone else tries the
admin login first.

## One more required step: enable Email/Password sign-in

Firebase Authentication needs to be turned on once, in the console:

1. Go to the Firebase Console → your `fgo-kingdom-dd7e8` project.
2. In the sidebar, under Build, click **Authentication**.
3. Click **Get started** if you haven't used Authentication before.
4. Under the **Sign-in method** tab, click **Email/Password**, toggle it to
   **Enabled**, and click **Save**.

Without this one toggle, sign-in and account creation will fail with an
error, even though everything else is set up correctly.

## Deploying with GitHub + Firebase Hosting (recommended)

1. Create a new GitHub repository and push this folder to it:
   ```
   git init
   git add .
   git commit -m "Initial FGO website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
2. Install the Firebase CLI if you don't have it: `npm install -g firebase-tools`
3. Log in: `firebase login`
4. From inside this folder, deploy:
   ```
   firebase deploy
   ```
   This uses the `firebase.json` and `.firebaserc` already in this folder,
   pointing at your `fgo-kingdom-dd7e8` project.
5. Firebase will give you a live URL like `https://fgo-kingdom-dd7e8.web.app`.

To auto-deploy on every GitHub push, connect the repo in the Firebase
Console under Hosting → Add another site → GitHub integration, or set up a
GitHub Action using `firebase-tools`.

## Deploying with GitHub Pages instead

GitHub Pages can host these files too, since Firestore (not the file host)
is what's doing the actual data storage:

1. Push this folder to a GitHub repo as above.
2. In the repo, go to Settings → Pages → set the source to your main branch.
3. Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

Either hosting choice works identically, since all the dynamic data lives in
Firestore, not on the file host.

## Security — what's been fixed, and what's still worth doing

As of this version, the admin panel uses **real Firebase Authentication**
(email/password), not a homegrown password check. Firestore's rules
(`firestore.rules`) now genuinely enforce who can read and write what:

- Member registrations, tickets, and giving records are readable only by
  signed-in, active admins — protecting names, phone numbers, and amounts.
- Sermons, events, testimony moderation, and site settings can only be
  written by a signed-in, active admin.
- Only the real Super Admin (verified through Firebase's own authentication,
  not a value typed into a form) can create or manage other admin accounts.
- One narrow, deliberate public exception: anyone can increment a
  testimony's reaction count by exactly 1, since that's meant to be a public
  action — nothing else about a testimony can be changed by a non-admin.

**Still worth doing, when you're ready to scale further:**
- Role-based permissions beyond "admin vs super" (e.g. an admin who can only
  manage sermons, not see giving records).
- Requiring email verification before an account counts as "real," which
  closes a small remaining gap: right now, whoever first successfully signs
  up as folahandaniel@gmail.com in Firebase Auth secures that identity, so
  do this soon rather than leaving it open indefinitely.
- Rate limiting or App Check, to slow down automated abuse of public write
  paths like registration and testimony submission.

## Updating Firestore rules

After any change to `firestore.rules`, deploy just the rules with:
```
firebase deploy --only firestore:rules
```

## Firebase config

Your project's web config lives in `js/firebase-config.js`. These values
(apiKey, projectId, etc.) are safe to have in public client-side code —
Firebase's own documentation confirms this is expected. Security comes from
Firestore rules, not from hiding this file.
