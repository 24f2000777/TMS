# TMS — Timetable Management System

A simple, free tool for building a school's weekly timetable. Add your teachers and subjects, say who teaches what, click one button, and get a clean weekly schedule for every class and every teacher — ready to view, print, or download as a PDF.

You do **not** need to know how to code to use this. This guide assumes you have never installed a program like this before, never used VS Code, and never typed a command into a terminal. Every single step is spelled out for both **Mac** and **Windows**.

---

## Table of contents

1. [What this app actually does](#what-this-app-actually-does)
2. [Step 1: Install Node.js](#step-1-install-nodejs)
3. [Step 2: Install VS Code](#step-2-install-vs-code)
4. [Step 3: Download the project](#step-3-download-the-project)
5. [Step 4: Open the project in VS Code](#step-4-open-the-project-in-vs-code)
6. [Step 5: Open the Terminal inside VS Code](#step-5-open-the-terminal-inside-vs-code)
7. [Step 6: Install the app's pieces (one-time)](#step-6-install-the-apps-pieces-one-time)
8. [Step 7: Start the app](#step-7-start-the-app)
9. [Step 8: Open the app in your browser](#step-8-open-the-app-in-your-browser)
10. [Using the app, step by step](#using-the-app-step-by-step)
11. [Extra features](#extra-features)
12. [Stopping the app, and starting it again later](#stopping-the-app-and-starting-it-again-later)
13. [Common questions](#common-questions)
14. [What's under the hood](#whats-under-the-hood-technical-readers)

---

## What this app actually does

Think of it as a digital version of the big timetable chart on the staff room wall, except it builds itself.

You tell it three simple things:
- **Who** your teachers are
- **What** subjects and classes you have
- **Which teacher teaches which subject to which class, and how many times a week**

Then you click **one button**, and it automatically lays out a full week's schedule for every class — making sure no teacher is ever double-booked, no class has two subjects at once, and nobody gets scheduled during lunch or a period they're unavailable.

Every class and every teacher then gets their own personal page you can look at, print, or save as a PDF.

Everything below is a one-time setup (Steps 1–6). Once it's done, starting the app again later only takes Steps 7–8, which take about 10 seconds.

---

## Step 1: Install Node.js

Node.js is the free program that actually runs this app. You install it once, like any other program.

### On Mac

1. Open your web browser and go to **[nodejs.org](https://nodejs.org)**
2. You'll see a big button that says **"LTS"** — click it to download
3. Open your **Downloads** folder and double-click the file you just downloaded (it will be named something like `node-v20.11.0.pkg`)
4. An installer window will open. Click **Continue**, **Continue**, **Agree**, **Install**
5. It may ask for your Mac password — type it in and click **Install Software**
6. Click **Close** when it finishes

### On Windows

1. Open your web browser and go to **[nodejs.org](https://nodejs.org)**
2. You'll see a big button that says **"LTS"** — click it to download
3. Open your **Downloads** folder and double-click the file you just downloaded (it will be named something like `node-v20.11.0-x64.msi`)
4. An installer window will open. Click **Next**, tick the box to accept the agreement, then keep clicking **Next** through each screen
5. Click **Install**, then **Finish**

### Check it worked (both Mac and Windows)

We'll properly open a terminal in Step 5, but for a quick check right now:

- **Mac:** press `Cmd + Space`, type `Terminal`, press Enter
- **Windows:** press the Windows key, type `cmd`, press Enter

Type this and press Enter:

```bash
node -v
```

If you see something like `v20.11.0`, it worked. If you see an error instead, restart your computer and try again — sometimes the installer needs a restart to finish setting up.

---

## Step 2: Install VS Code

VS Code is a free program for viewing and running project folders like this one. You don't need to know how to write code to use it here — we're only using its built-in terminal.

### On Mac

1. Go to **[code.visualstudio.com](https://code.visualstudio.com)**
2. Click the big download button (it should automatically detect Mac)
3. Open your **Downloads** folder — you'll see a file called `VSCode-darwin-universal.zip`, which unzips itself into an app called **Visual Studio Code**
4. Drag **Visual Studio Code** into your **Applications** folder
5. Open it from Applications (the first time, you may need to right-click it and choose **Open**, then confirm, since it was downloaded from the internet)

### On Windows

1. Go to **[code.visualstudio.com](https://code.visualstudio.com)**
2. Click the big download button (it should automatically detect Windows)
3. Open your **Downloads** folder and double-click the installer file (named something like `VSCodeUserSetup-x64-...exe`)
4. Click **I accept the agreement**, then **Next** through each screen (the default options are fine)
5. Click **Install**, then **Finish** — VS Code will open automatically

---

## Step 3: Download the project

1. Go to this project's GitHub page in your browser: **https://github.com/24f2000777/TMS**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Find the downloaded file in your **Downloads** folder — it will be called `TMS-main.zip`
5. **Unzip it:**
   - **Mac:** double-click the ZIP file — it creates a folder called `TMS-main`
   - **Windows:** right-click the ZIP file and choose **"Extract All..."**, then click **Extract**
6. **Rename and move the folder:** rename `TMS-main` to just `TMS`, and drag it onto your **Desktop** so it's easy to find

You should now have a folder on your Desktop called `TMS`.

---

## Step 4: Open the project in VS Code

1. Open **VS Code**
2. Click **File** (top menu) → **Open Folder...**
3. Navigate to your Desktop, select the **TMS** folder, and click **Open** (on Mac you may need to click **Open** again to confirm)
4. You'll see a list of files and folders appear on the left-hand side — that means it worked

---

## Step 5: Open the Terminal inside VS Code

VS Code has a built-in terminal, so you never need to switch to a separate app.

1. With the TMS folder open in VS Code, click **Terminal** (top menu) → **New Terminal**
2. A panel will open at the bottom of the window with a blinking cursor, already pointed at your TMS folder

This is where you'll type the commands in the next two steps.

---

## Step 6: Install the app's pieces (one-time)

In the terminal panel you just opened, type this and press Enter:

```bash
npm install
```

You'll see a lot of text scroll by for a minute or two — that's completely normal, it's just downloading the small pieces of code this app depends on. When it stops and gives you back a blinking cursor, it's done.

**You only ever need to do this once**, even if you close VS Code and come back days later. Skip this step next time.

---

## Step 7: Start the app

In the same terminal, type this and press Enter:

```bash
node server.js
```

You should see:

```
TMS running at http://localhost:3000
```

**Leave this terminal panel open and VS Code running** — the app only works while this is running. Closing VS Code or pressing a key that stops this will turn the app off.

---

## Step 8: Open the app in your browser

Open any web browser (Chrome, Safari, Edge — whichever you normally use) and type this into the address bar:

```
http://localhost:3000
```

Press Enter. You're in.

---

## Using the app, step by step

### Step 1 — Setup: enter your raw data

Click **Setup** at the top.

This page is where you type in the basic building blocks, one box at a time.

| What | How |
|---|---|
| **Week structure** | Set your school days (e.g. `Mon, Tue, Wed, Thu, Fri, Sat`) and how many periods there are each day (e.g. `8`). Click **Save**. |
| **Break periods** | Tick any period that should never have a class scheduled in it (like lunch). |
| **Teachers** | Type a teacher's name in the box, click **Add**. Repeat for every teacher. |
| **Subjects** | Same idea — type a subject name, click **Add**. |
| **Classes** | Same idea — type a class name (like `10A`), click **Add**. |
| **Rooms** *(optional)* | Only needed if you want to prevent two classes using the same lab/hall at once. |
| **Teacher unavailability** *(optional)* | Pick a teacher, then click any time slot to mark it as a time they can never be scheduled (e.g. they work part-time). |

Every box has a **Remove** button next to each entry if you make a mistake or need to delete something.

### Step 2 — Assignments: say who teaches what

Click **Assignments** at the top.

This is the most important page. Each row you add here is one simple fact, like:

> *"Mrs. Sharma teaches Math to class 10A, 6 times a week."*

To add one:
1. Pick a **Teacher** from the dropdown
2. Pick a **Subject** from the dropdown
3. Type a number in **Periods/week** (how many times a week this happens)
4. Tick the **Class** this is for — tick more than one class if two classes are meant to share this period together (like a joint Sports class)
5. Click **Add Assignment**

Do this once for every teacher + subject + class combination at your school. It feels repetitive, but it's the only data entry step — once it's done, the app does the rest.

### Step 3 — Generate: build the timetable automatically

Go back to **Home**. Click the big **Generate Timetable** button.

The app will instantly build a full week's schedule for every class, making sure:
- No teacher is ever scheduled in two places at once
- No class has two subjects at the same time
- Nobody is scheduled during a break period or a time they marked unavailable

**If everything worked**, you'll see a green success message.

**If something couldn't fit** (for example, a teacher was assigned more periods than there are slots in the week), you'll see a message telling you exactly who and what — go back to Assignments, lower that number, and click Generate again.

### Step 4 — View, print, and download

Back on the **Home** page, you'll now see a list of every class and every teacher.

- **Click a class** to see its full week — every subject, every period, every teacher, laid out in a grid.
- **Click a teacher** to see only their personal schedule.
- On a teacher's page, there are two buttons:
  - **Download PDF** — saves a clean, printable file they can keep or email
  - **Print** — opens your browser's normal print dialog right there

That's the whole process: **Setup → Assignments → Generate → View/Print/Download.**

---

## Extra features

These are optional, for when the basics aren't quite enough:

- **Combined periods** — tick more than one class when adding an Assignment to create a joint period (two classes merged into one session, like Sports or Assembly).
- **Fixed periods** — on the Assignments page, you can "lock" a specific assignment to an exact day and period (e.g. "Math for 10A is always Wednesday, Period 3"). The app will never move a locked slot.
- **Manual edits** — on any class's timetable page, every box has a small **Edit** link to change or clear just that one period by hand, without rebuilding the whole week.
- **Substitutes** — click **Substitutes** at the top. Pick a date and a teacher who's absent, and the app shows you their periods that day with a dropdown to assign someone else to cover — without changing your permanent timetable.
- **Rooms and max-per-day** — when adding an Assignment, you can optionally attach a room (to avoid double-booking a lab) or a cap on how many times that subject can appear on the same day.

---

## Stopping the app, and starting it again later

**To stop the app:** click into the terminal panel in VS Code where it's running, and press `Ctrl + C` (on both Mac and Windows).

**To start it again later** (any time after today — you've already done the one-time setup):

1. Open **VS Code**
2. **File** → **Open Folder...** → select your **TMS** folder → **Open**
3. **Terminal** → **New Terminal**
4. Type `node server.js` and press Enter
5. Open your browser to `http://localhost:3000`

You do **not** need to run `npm install` again — that was a one-time step.

---

## Common questions

**"I closed VS Code and now the website won't load."**
The app only runs while VS Code's terminal is open and `node server.js` is running. Follow the "start it again later" steps above.

**"Do I need the internet to use this?"**
No — once everything is installed, the app itself runs entirely on your own computer. You only need the internet for the one-time install steps.

**"Can other teachers access it from their own computers?"**
Not by default — it only runs on the computer where you started it, and only that computer can open `http://localhost:3000`. If you want other people on other devices to access it, that requires some extra setup (hosting it online) — ask if you want help with that.

**"I made a mistake, how do I start completely fresh?"**
In VS Code's file list on the left, find the file called `tms.db` inside the TMS folder, right-click it, and delete it. Next time you run `node server.js`, it will create a brand new, empty database.

**"The page looks broken / buttons are missing."**
Try a hard refresh: hold `Shift` and click the browser's refresh button (or press `Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows).

**"Where is my data saved?"**
Everything you enter is saved automatically in a file called `tms.db` inside the TMS folder. There's no "Save" button to remember — every change is saved instantly.

**"I typed `node server.js` and got a red error instead of 'TMS running...'"**
Make sure you're in the right folder. In the terminal, type `pwd` (Mac) or `cd` (Windows) and press Enter to see which folder you're in — it should end in `TMS`. If it doesn't, close the terminal, re-open it with **Terminal → New Terminal** while the TMS folder is open in VS Code, and try again.

---

## What's under the hood (technical readers)

- **Backend:** Node.js + Express
- **Database:** SQLite via `better-sqlite3` (a single local file, `tms.db`, no separate database server needed)
- **Views:** Server-rendered EJS templates
- **PDF export:** `pdfkit`

### Project structure

```
server.js        → app entry point and route mounting
db.js             → database schema and migrations
scheduler.js       → the timetable-generation algorithm
pdf.js              → teacher PDF export
routes/              → setup, assignments, timetable, substitutes
views/                → EJS page templates
public/                → static CSS
```

### Scheduling algorithm

A greedy, round-robin scheduler: assignments are placed one period at a time, always preferring the day with the fewest periods of that subject already placed (to spread subjects evenly across the week) and avoiding back-to-back repeats where possible. Locked slots, teacher unavailability, room conflicts, break periods, and per-day subject caps are all treated as hard constraints the generator will never violate.

### Note on `tms.db`

The database file is excluded from this repository (see `.gitignore`) since it holds real names and schedule data. Cloning this repo gives you a fresh, empty app — the database is created automatically the first time you run `node server.js`.
