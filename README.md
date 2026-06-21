# StudentOS

A section-level QR attendance app built for Philippine classrooms. Designed for students, parents, advisers, and class monitors.

---

## What is StudentOS?

StudentOS replaces manual attendance sheets with a fast QR scanning system. The class monitor displays QR codes at the start of class, students scan with their phones, and parents receive instant notifications — all in real time.

---

## Features

- **QR attendance scanning** — Students scan to mark themselves Present, Late, or Excused
- **Smart Late detection** — Automatically marks Late based on scan timestamp, no extra QR needed
- **Excused request form** — Students write a formal excuse letter in the app, adviser approves or denies it
- **Session manager** — Start, pause, resume, and end sessions with a live countdown timer
- **Live roster** — Adviser and monitor see attendance update in real time as students scan
- **Parent notifications** — Parents receive an instant push notification every time their child's status changes
- **Parent linking** — Students generate a private link code, parents enter it to connect accounts
- **Attendance history** — Full calendar view of all records for students and parents
- **Streak tracker** — Students see their consecutive Present streak and absence count
- **Attendance export** — Adviser can export records for official use
- **Permanent login** — Stay signed in across app restarts

---

## Roles

| Role | Access |
|---|---|
| Adviser | Full control — create section, manage sessions, approve students, override statuses, export records |
| Class Monitor | Same access as Adviser |
| Student | Scan QR, submit excused requests, view own history, generate parent link |
| Parent | Receive push notifications, view child's full attendance history |

---

## Attendance statuses

| Status | Meaning |
|---|---|
| Present | Scanned within the present window |
| Late | Scanned after the present window closed |
| Absent | Auto-assigned when session ends with no scan |
| Excused | Approved by adviser or monitor |
| Pending | Excused request submitted, awaiting review |

---

## How it works

1. Adviser creates the section and shares a join code with students
2. Students sign up and wait for adviser approval
3. Students generate a parent link code and share it with their parents
4. Parents sign up and enter the link code to connect
5. Each school day, the monitor starts a session — QR codes appear on screen
6. Students open the app and scan the QR code
7. Parents receive a push notification instantly
8. When the session ends, unscanned students are automatically marked Absent
9. Absent parents are notified immediately

---

## Download

Download the latest version from the [Releases](../../releases) page.

---

## Built with

- React Native (Expo)
- Firebase (Auth, Firestore, Cloud Messaging)
- Codemagic CI/CD

---

## License

This app is proprietary. The source code is not open for reuse, modification, or redistribution.

© 2026 StudentOS. All rights reserved.
