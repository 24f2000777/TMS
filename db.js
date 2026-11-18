const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tms.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    days TEXT NOT NULL,
    periods_per_day INTEGER NOT NULL,
    break_periods TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS teacher_unavailability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    period INTEGER NOT NULL,
    UNIQUE(teacher_id, day, period)
  );

  CREATE TABLE IF NOT EXISTS substitutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    day INTEGER NOT NULL,
    period INTEGER NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    original_teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    substitute_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE(date, class_id, period)
  );
`);

// --- Migration: assignments used to carry a single class_id directly.
// Move to a many-to-many (assignment_classes) so one assignment can cover
// several classes at once (combined/merged periods).
//
// NOTE: renaming a table makes SQLite rewrite the FK text of any other
// table that references it (e.g. timetable_slots.assignment_id), pointing
// those FKs at the new name. legacy_alter_table=ON suppresses that rewrite,
// so the FK text stays "REFERENCES assignments(...)" and correctly resolves
// to whichever table currently holds that name once we recreate it below.
const assignmentsInfo = db.prepare("PRAGMA table_info(assignments)").all();
const hasOldClassIdColumn = assignmentsInfo.some((c) => c.name === 'class_id');

if (hasOldClassIdColumn) {
  db.pragma('legacy_alter_table = ON');
  db.exec('ALTER TABLE assignments RENAME TO assignments_old');
  db.pragma('legacy_alter_table = OFF');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    periods_per_week INTEGER NOT NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    max_per_day INTEGER
  );

  CREATE TABLE IF NOT EXISTS assignment_classes (
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, class_id)
  );

  CREATE TABLE IF NOT EXISTS timetable_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    period INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    locked INTEGER NOT NULL DEFAULT 0
  );
`);

if (hasOldClassIdColumn) {
  db.exec(`
    INSERT INTO assignments (id, teacher_id, subject_id, periods_per_week)
    SELECT id, teacher_id, subject_id, periods_per_week FROM assignments_old;

    INSERT INTO assignment_classes (assignment_id, class_id)
    SELECT id, class_id FROM assignments_old;

    DROP TABLE assignments_old;
  `);
}

// --- Migration: assignments may pre-date room_id / max_per_day.
const assignmentsCols = db.prepare("PRAGMA table_info(assignments)").all();
if (!assignmentsCols.some((c) => c.name === 'room_id')) {
  db.exec('ALTER TABLE assignments ADD COLUMN room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL');
}
if (!assignmentsCols.some((c) => c.name === 'max_per_day')) {
  db.exec('ALTER TABLE assignments ADD COLUMN max_per_day INTEGER');
}

// --- Migration: settings may pre-date break_periods.
const settingsCols = db.prepare("PRAGMA table_info(settings)").all();
if (!settingsCols.some((c) => c.name === 'break_periods')) {
  db.exec("ALTER TABLE settings ADD COLUMN break_periods TEXT NOT NULL DEFAULT '[]'");
}

// --- Migration: timetable_slots may pre-date the `locked` column.
const slotsInfo = db.prepare("PRAGMA table_info(timetable_slots)").all();
if (!slotsInfo.some((c) => c.name === 'locked')) {
  db.exec('ALTER TABLE timetable_slots ADD COLUMN locked INTEGER NOT NULL DEFAULT 0');
}

// --- Repair: an earlier version of the migration above could leave
// timetable_slots with a dangling FK to the now-dropped "assignments_old"
// table (see note above). Rebuild the table cleanly if that happened.
const timetableSlotsSql = db
  .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'timetable_slots'")
  .get();

if (timetableSlotsSql && timetableSlotsSql.sql.includes('assignments_old')) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    ALTER TABLE timetable_slots RENAME TO timetable_slots_broken;

    CREATE TABLE timetable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      period INTEGER NOT NULL,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      locked INTEGER NOT NULL DEFAULT 0
    );

    INSERT INTO timetable_slots (id, class_id, day, period, assignment_id, locked)
    SELECT id, class_id, day, period, assignment_id, locked FROM timetable_slots_broken;

    DROP TABLE timetable_slots_broken;
  `);
  db.pragma('foreign_keys = ON');
}

const existingSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
if (!existingSettings) {
  db.prepare('INSERT INTO settings (id, days, periods_per_day) VALUES (1, ?, ?)').run(
    JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    8
  );
}

module.exports = db;
