# StudentOS

Section-level QR attendance app for students, parents, advisers, and class monitors.

Built with React Native (Expo) + Firebase. No backend server needed.

---

## Accounts you need (all free)

| Account | Cost | Link |
|---|---|---|
| Google account | Free | accounts.google.com |
| Firebase project | Free | console.firebase.google.com |
| GitHub account | Free | github.com |
| Codemagic account | Free tier | codemagic.io |
| Apple ID (iOS only) | Free | appleid.apple.com |

---

## Step 1 — Firebase setup

1. Go to console.firebase.google.com
2. Click "Add project" → name it **StudentOS** → disable Analytics → Create
3. Click the **Android** icon → package name: `com.studentos.app` → Register → download **google-services.json**
4. Click the **iOS** icon → bundle ID: `com.studentos.app` → Register → download **GoogleService-Info.plist**
5. Go to **Project Settings** (gear icon) → **General** → scroll to "Your apps" → copy all values from the firebaseConfig object

### Enable Firebase services

| Service | Steps |
|---|---|
| Authentication | Authentication → Get started → Email/Password → Enable → Save |
| Firestore | Firestore Database → Create database → Region: **asia-southeast1** → Test mode → Enable |
| Storage | Storage → Get started → Test mode → Done |
| FCM (push) | Already enabled — nothing to do |

### Firestore security rules

After creating Firestore, go to **Rules** tab and paste the contents of `firestore.rules` from this project.

Do the same for **Storage → Rules** using `storage.rules`.

---

## Step 2 — GitHub setup

1. Go to github.com → Sign up (free)
2. Create new repository → name: **studentos** → Private → Create
3. Upload ALL files from this project EXCEPT:
   - `.env`
   - `google-services.json`
   - `GoogleService-Info.plist`
4. Make sure `.gitignore` is uploaded (it prevents accidental key leaks)

---

## Step 3 — Add your Firebase keys to the project

1. Copy `.env.example` → rename it to `.env`
2. Fill in your Firebase values:

```
FIREBASE_API_KEY=your_value
FIREBASE_AUTH_DOMAIN=your_value
FIREBASE_PROJECT_ID=your_value
FIREBASE_STORAGE_BUCKET=your_value
FIREBASE_MESSAGING_SENDER_ID=your_value
FIREBASE_APP_ID=your_value
```

3. Also open `src/services/firebase.ts` and replace the placeholder strings with your real values as a backup.

---

## Step 4 — Codemagic setup

1. Go to codemagic.io → Sign up with GitHub
2. Click "Add application" → select your **studentos** repo → React Native App → Finish
3. Go to **Environment variables** → add these one by one:

| Variable | Value |
|---|---|
| FIREBASE_API_KEY | from Firebase |
| FIREBASE_AUTH_DOMAIN | from Firebase |
| FIREBASE_PROJECT_ID | from Firebase |
| FIREBASE_STORAGE_BUCKET | from Firebase |
| FIREBASE_MESSAGING_SENDER_ID | from Firebase |
| FIREBASE_APP_ID | from Firebase |
| GOOGLE_SERVICES_JSON | base64 of google-services.json |
| GOOGLE_SERVICE_INFO_PLIST | base64 of GoogleService-Info.plist |

### How to convert files to base64

On Mac/Linux terminal:
```
base64 -i google-services.json | pbcopy
```

On Windows (PowerShell):
```
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json")) | clip
```

Paste the copied output as the variable value.

4. Group the variables:
   - Select FIREBASE_* variables → group name: **firebase_credentials**
   - Select GOOGLE_SERVICES_JSON + GOOGLE_SERVICE_INFO_PLIST → same group

5. Go to **Start new build** → select **android-workflow** → Start

Codemagic will build the APK and email it to you when done (~10–15 min).

---

## Step 5 — Install on your phone

### Android
Open the APK download link from your Codemagic email → tap to install.
(You may need to allow "Install from unknown sources" in Android settings.)

### iPhone (free, no Apple Developer account)
1. Download the IPA from your Codemagic email
2. Install **AltStore** on your iPhone (altstore.io — free)
3. Drag the IPA into AltStore → install
4. App is installed on your device for 7 days (refresh weekly via AltStore)

---

## App structure

```
StudentOS/
├── App.tsx                          Entry point
├── app.json                         Expo config
├── babel.config.js                  Babel (Reanimated plugin)
├── codemagic.yaml                   CI/CD pipeline
├── firestore.rules                  Database security rules
├── storage.rules                    Storage security rules
└── src/
    ├── constants/
    │   ├── colors.ts                Design tokens
    │   ├── typography.ts            Font sizes/weights
    │   ├── index.ts                 Roles, statuses, enums
    │   └── types.ts                 TypeScript interfaces
    ├── services/
    │   ├── firebase.ts              Firebase init
    │   ├── auth.service.ts          Sign in/up/out
    │   ├── session.service.ts       Create/start/end sessions
    │   ├── attendance.service.ts    Record scans, auto-absent
    │   ├── excused.service.ts       Submit/approve/deny requests
    │   ├── parentLink.service.ts    Generate/consume link codes
    │   ├── notification.service.ts  Push notifications via FCM
    │   ├── storage.service.ts       Upload excuse letter photos
    │   └── qr.service.ts            Generate/parse QR payloads
    ├── hooks/
    │   ├── useAuth.ts               Current user + profile
    │   └── useSession.ts            Session, roster, history hooks
    ├── navigation/
    │   └── RootNavigator.tsx        Role-based routing
    ├── components/
    │   ├── common/index.tsx         Button, Card, Input, Badge, Avatar...
    │   └── animations/index.tsx     FadeInView, ScalePress, PulseView...
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.tsx
        │   └── AuthScreens.tsx      Login, Register, Pending
        ├── adviser/
        │   └── AdviserScreens.tsx   Home, Session, Roster, Excused
        ├── student/
        │   └── StudentScreens.tsx   Home, Scan, Form, History, Link
        └── parent/
            └── ParentScreens.tsx    Home, Child history, Link child
```

---

## First run — adviser setup

1. Adviser registers with role "Adviser"
2. Adviser creates the section in their dashboard
3. Adviser shares the section join code with students
4. Students register and wait for approval
5. Adviser approves students in the dashboard
6. Adviser promotes one student to Class Monitor
7. Students generate parent link codes and share with parents
8. Parents register and enter the link code

That's it — the app is ready for daily attendance.

---

## Daily attendance flow

1. Monitor opens app → Session tab → Start session
2. QR codes appear on screen — show to class
3. Students scan QR with their app
4. Parents receive push notification instantly
5. Monitor ends session when class is done
6. Unscanned students auto-marked Absent
7. Absent parents notified

