# TMS — Timetable Management System

A simple, free tool for building a school's weekly timetable. Add your teachers and subjects, say who teaches what, click one button, and get a clean weekly schedule for every class and every teacher — ready to view, print, or download as a PDF.

You do **not** need to know how to code to use this. This guide walks you through everything, one step at a time, assuming you've never opened a terminal before.

---

## Table of contents

1. [What this app actually does](#what-this-app-actually-does)
2. [What you need before you start](#what-you-need-before-you-start)
3. [Getting the app onto your computer](#getting-the-app-onto-your-computer)
4. [Starting the app](#starting-the-app)
5. [Using the app, step by step](#using-the-app-step-by-step)
6. [Extra features](#extra-features)
7. [Common questions](#common-questions)
8. [Stopping and restarting the app](#stopping-and-restarting-the-app)
9. [What's under the hood](#whats-under-the-hood-technical-readers)

---

## What this app actually does

Think of it as a digital version of the big timetable chart on the staff room wall, except it builds itself.

You tell it three simple things:
- **Who** your teachers are
- **What** subjects and classes you have
- **Which teacher teaches which subject to which class, and how many times a week**

Then you click **one button**, and it automatically lays out a full week's schedule for every class — making sure no teacher is ever double-booked, no class has two subjects at once, and nobody gets scheduled during lunch or a period they're unavailable.

Every class and every teacher then gets their own personal page you can look at, print, or save as a PDF.

---

## What you need before you start

You need one free program installed on your computer called **Node.js**. It's what actually runs this app.

1. Go to **[nodejs.org](https://nodejs.org)**
2. Click the big green button that says **"LTS"** (this just means the stable, recommended version)
3. Open the file it downloads and click through the installer (Next, Next, Install, Finish) — the default settings are fine
4. That's it. You don't need to understand what Node.js is, just that it needs to be installed once.

**How to check it worked:** Open your computer's terminal app —
- **Mac:** press `Cmd + Space`, type `Terminal`, press Enter
- **Windows:** press the Windows key, type `cmd`, press Enter

Type this and press Enter:

```bash
node -v
```

If you see something like `v20.11.0`, it worked. If you see an error, Node.js didn't install correctly — try the steps above again.

---

## Getting the app onto your computer

If you already have this project folder on your computer (e.g. you were given a `TMS` folder), skip to [Starting the app](#starting-the-app).

Otherwise, to download it from GitHub:

1. Go to the repository page in your browser
2. Click the green **"Code"** button, then **"Download ZIP"**
3. Find the downloaded ZIP file (usually in your Downloads folder) and double-click it to unzip it
4. You'll now have a folder called `TMS` — move it somewhere easy to find, like your Desktop

**If you know what Git is**, you can instead run:
```bash
git clone https://github.com/24f2000777/TMS.git
```

---

## Starting the app

Every time you want to use the app, you do these two things:

1. Open your terminal (Mac: `Cmd + Space` → type `Terminal`. Windows: Windows key → type `cmd`)
2. Type the following, one line at a time, pressing Enter after each:

```bash
cd Desktop/TMS
```
*(This tells the terminal "go into the TMS folder." If you put the folder somewhere other than your Desktop, adjust the path accordingly.)*

The very first time only, also run:
```bash
npm install
```
*(This downloads the small pieces of code the app depends on. It takes a minute or two and you'll see a lot of text scroll by — that's normal. You only ever need to do this once.)*

Then, every time, run:
```bash
node server.js
```

You'll see this message:
```
TMS running at http://localhost:3000
```

**Leave this terminal window open** — closing it turns the app off. Now open your web browser (Chrome, Safari, Edge, whatever you normally use) and go to:

```
http://localhost:3000
```

You're in.

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

## Common questions

**"I closed the terminal and now the website won't load."**
The app only runs while that terminal window is open. Open a new terminal, `cd` into the TMS folder, and run `node server.js` again.

**"Do I need the internet to use this?"**
No — once it's installed, everything runs on your own computer. The only thing you need the internet for is the one-time download/install steps.

**"Can other teachers access it from their own computers?"**
Not by default — it only runs on the computer where you started it, and only that computer can open `http://localhost:3000`. If you want other people on other devices to access it, that requires some extra setup (hosting it online) — ask if you want help with that.

**"I made a mistake, how do I start completely fresh?"**
Close the terminal, find the file called `tms.db` inside the TMS folder, and delete it. Next time you run `node server.js`, it will create a brand new, empty database.

**"The page looks broken / buttons are missing."**
Try a hard refresh: hold `Shift` and click the browser's refresh button (or press `Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows).

**"Where is my data saved?"**
Everything you enter is saved automatically in a file called `tms.db` inside the TMS folder. There's no "Save" button to remember — every change is saved instantly.

---

## Stopping and restarting the app

To stop the app: click into the terminal window where it's running and press `Ctrl + C`.

To start it again later: open a terminal, run:
```bash
cd Desktop/TMS
node server.js
```
(no need to run `npm install` again unless you deleted the `node_modules` folder)

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
