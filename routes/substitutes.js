const express = require('express');
const db = require('../db');

const router = express.Router();

function getSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  settings.days = JSON.parse(settings.days);
  return settings;
}

// Maps a JS Date's day-of-week (0=Sun..6=Sat) to an index in settings.days,
// by matching the first three letters of the weekday name.
function dayIndexForDate(dateStr, settings) {
  const date = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return null;

  const weekdayAbbrev = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const idx = settings.days.findIndex((d) => d.slice(0, 3).toLowerCase() === weekdayAbbrev.toLowerCase());
  return idx === -1 ? null : idx;
}

router.get('/', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers ORDER BY name').all();
  const settings = getSettings();

  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const absentTeacherId = req.query.teacher_id ? parseInt(req.query.teacher_id, 10) : null;

  let periods = [];
  let dayIndex = null;

  if (absentTeacherId) {
    dayIndex = dayIndexForDate(date, settings);

    if (dayIndex !== null) {
      const slots = db
        .prepare(
          `SELECT ts.period, ts.class_id, ts.assignment_id, c.name AS className, s.name AS subject
           FROM timetable_slots ts
           JOIN assignments a ON a.id = ts.assignment_id
           JOIN subjects s ON s.id = a.subject_id
           JOIN classes c ON c.id = ts.class_id
           WHERE a.teacher_id = ? AND ts.day = ?
           ORDER BY ts.period`
        )
        .all(absentTeacherId, dayIndex);

      const existingSubs = db
        .prepare('SELECT * FROM substitutions WHERE date = ? AND original_teacher_id = ?')
        .all(date, absentTeacherId);
      const subsByPeriodClass = new Map(existingSubs.map((s) => [`${s.period}:${s.class_id}`, s]));

      periods = slots.map((slot) => {
        const busyTeacherIds = db
          .prepare(
            `SELECT DISTINCT a.teacher_id FROM timetable_slots ts
             JOIN assignments a ON a.id = ts.assignment_id
             WHERE ts.day = ? AND ts.period = ?`
          )
          .all(dayIndex, slot.period)
          .map((r) => r.teacher_id);

        const freeTeachers = teachers.filter((t) => t.id !== absentTeacherId && !busyTeacherIds.includes(t.id));
        const existing = subsByPeriodClass.get(`${slot.period}:${slot.class_id}`);

        return {
          ...slot,
          periodLabel: `P${slot.period + 1}`,
          freeTeachers,
          currentSubstituteId: existing ? existing.substitute_teacher_id : null,
        };
      });
    }
  }

  const upcoming = db
    .prepare(
      `SELECT sub.*, ot.name AS original_teacher_name, st.name AS substitute_teacher_name, c.name AS className, s.name AS subject
       FROM substitutions sub
       JOIN teachers ot ON ot.id = sub.original_teacher_id
       LEFT JOIN teachers st ON st.id = sub.substitute_teacher_id
       JOIN classes c ON c.id = sub.class_id
       JOIN assignments a ON a.id = sub.assignment_id
       JOIN subjects s ON s.id = a.subject_id
       WHERE sub.date >= date('now')
       ORDER BY sub.date, sub.period`
    )
    .all();

  res.render('substitutes', {
    teachers,
    settings,
    date,
    absentTeacherId,
    dayIndex,
    dayName: dayIndex !== null ? settings.days[dayIndex] : null,
    periods,
    upcoming,
    error: req.query.error,
  });
});

router.post('/', (req, res) => {
  const date = req.body.date;
  const absentTeacherId = parseInt(req.body.teacher_id, 10);
  const classId = parseInt(req.body.class_id, 10);
  const period = parseInt(req.body.period, 10);
  const assignmentId = parseInt(req.body.assignment_id, 10);
  const substituteTeacherId = req.body.substitute_teacher_id ? parseInt(req.body.substitute_teacher_id, 10) : null;

  const settings = getSettings();
  const dayIndex = dayIndexForDate(date, settings);

  if (dayIndex === null) {
    return res.redirect('/substitutes?error=' + encodeURIComponent('Could not match that date to a configured weekday'));
  }

  db.prepare(
    `INSERT INTO substitutions (date, day, period, class_id, assignment_id, original_teacher_id, substitute_teacher_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date, class_id, period) DO UPDATE SET substitute_teacher_id = excluded.substitute_teacher_id`
  ).run(date, dayIndex, period, classId, assignmentId, absentTeacherId, substituteTeacherId);

  res.redirect(`/substitutes?date=${date}&teacher_id=${absentTeacherId}`);
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM substitutions WHERE id = ?').run(req.params.id);
  res.redirect('/substitutes');
});

module.exports = router;
