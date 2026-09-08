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

The very first person to log in at `/admin.html` with the username **FBanjo**
becomes the Super Admin — this is hardcoded in `js/admin.js`
(`DESIGNATED_SUPER_ADMIN_USERNAME`) so no one else can accidentally claim it.
Log in there first, with whatever password you want, before sharing the
site publicly.

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

## Security — what's next (important, please read)

Right now, the admin panel authenticates with a username/password stored
**in Firestore itself** (hashed, not plain text) — not with real Firebase
Authentication. That means Firestore's security rules (`firestore.rules`)
can't actually tell the difference between "the admin panel" and "anyone
who finds the Firestore write endpoint directly." The rules in this project
reflect that honestly:

- Member registrations, tickets, and giving records are **not publicly
  readable** — protecting names, phone numbers, and amounts from casual
  snooping.
- Sermons, events, testimonies, and admin accounts currently allow **open
  writes**, because there's no server-side way yet to verify "this write
  came from a logged-in admin."

**The real fix** is adding Firebase Authentication (email/password sign-in
for admins) so the rules can check `request.auth != null` and actually
enforce who can write what. This is a meaningful next step before this
site holds a large, real, public audience — happy to build it in a follow-up
round.

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
