# TMS — Timetable Management System

A small Node.js + Express + SQLite app for building and managing a school's weekly timetable: set up teachers, subjects, classes, and rooms; define who teaches what; auto-generate a conflict-free weekly schedule; and let each teacher view, print, or download their own timetable as a PDF.

## Features

- Auto-generate a weekly timetable with conflict checking (no teacher or class double-booked)
- Combined/merged periods across multiple classes (e.g. joint Sports or Assembly)
- Fixed/locked periods that the generator will never move
- Room allocation and teacher unavailability as hard constraints
- Per-day period caps, and global break periods (lunch, recess)
- Manual override of a single period without a full regenerate
- Substitute teacher assignment for a single date, without touching the permanent timetable
- Per-class and per-teacher views, with PDF download and print support

## Getting started

```bash
npm install
node server.js
```

Then open `http://localhost:3000`.

## Stack

- Express + EJS (server-rendered views)
- SQLite via `better-sqlite3`
- `pdfkit` for PDF export

## Project structure

- `server.js` — app entry point and route mounting
- `db.js` — SQLite schema and migrations
- `scheduler.js` — the timetable-generation algorithm
- `pdf.js` — teacher PDF export
- `routes/` — Express routers (setup, assignments, timetable, substitutes)
- `views/` — EJS templates
- `public/` — static assets (CSS)
