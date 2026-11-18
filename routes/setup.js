const express = require('express');
const db = require('../db');

const router = express.Router();

function getSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  settings.days = JSON.parse(settings.days);
  settings.break_periods = JSON.parse(settings.break_periods || '[]');
  return settings;
}

router.get('/', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers ORDER BY name').all();
  const subjects = db.prepare('SELECT * FROM subjects ORDER BY name').all();
  const classes = db.prepare('SELECT * FROM classes ORDER BY name').all();
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY name').all();
  const settings = getSettings();

  const selectedTeacherId = req.query.teacher_id ? parseInt(req.query.teacher_id, 10) : (teachers[0] && teachers[0].id);
  const unavailability = selectedTeacherId
    ? db.prepare('SELECT day, period FROM teacher_unavailability WHERE teacher_id = ?').all(selectedTeacherId)
    : [];
  const unavailableSet = new Set(unavailability.map((u) => `${u.day}:${u.period}`));

  res.render('setup', {
    teachers,
    subjects,
    classes,
    rooms,
    settings,
    selectedTeacherId,
    unavailableSet,
    error: req.query.error,
  });
});

router.post('/teachers', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) {
    try {
      db.prepare('INSERT INTO teachers (name) VALUES (?)').run(name);
    } catch (e) {
      return res.redirect('/setup?error=' + encodeURIComponent('Teacher already exists'));
    }
  }
  res.redirect('/setup');
});

router.post('/teachers/:id/delete', (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
  res.redirect('/setup');
});

router.post('/subjects', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) {
    try {
      db.prepare('INSERT INTO subjects (name) VALUES (?)').run(name);
    } catch (e) {
      return res.redirect('/setup?error=' + encodeURIComponent('Subject already exists'));
    }
  }
  res.redirect('/setup');
});

router.post('/subjects/:id/delete', (req, res) => {
  db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
  res.redirect('/setup');
});

router.post('/classes', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) {
    try {
      db.prepare('INSERT INTO classes (name) VALUES (?)').run(name);
    } catch (e) {
      return res.redirect('/setup?error=' + encodeURIComponent('Class already exists'));
    }
  }
  res.redirect('/setup');
});

router.post('/classes/:id/delete', (req, res) => {
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.redirect('/setup');
});

router.post('/rooms', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) {
    try {
      db.prepare('INSERT INTO rooms (name) VALUES (?)').run(name);
    } catch (e) {
      return res.redirect('/setup?error=' + encodeURIComponent('Room already exists'));
    }
  }
  res.redirect('/setup');
});

router.post('/rooms/:id/delete', (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.redirect('/setup');
});

router.post('/settings', (req, res) => {
  const daysRaw = (req.body.days || '').trim();
  const periodsPerDay = parseInt(req.body.periods_per_day, 10);
  const breakPeriods = [].concat(req.body.break_periods || []).map((p) => parseInt(p, 10)).filter((p) => !Number.isNaN(p));

  const days = daysRaw.split(',').map((d) => d.trim()).filter(Boolean);

  if (days.length > 0 && periodsPerDay > 0) {
    db.prepare('UPDATE settings SET days = ?, periods_per_day = ?, break_periods = ? WHERE id = 1').run(
      JSON.stringify(days),
      periodsPerDay,
      JSON.stringify(breakPeriods)
    );
  }
  res.redirect('/setup');
});

// Teacher unavailability: toggle one day/period cell on or off for a teacher.
router.post('/unavailability', (req, res) => {
  const teacherId = parseInt(req.body.teacher_id, 10);
  const day = parseInt(req.body.day, 10);
  const period = parseInt(req.body.period, 10);

  if (!teacherId || Number.isNaN(day) || Number.isNaN(period)) {
    return res.redirect('/setup');
  }

  const existing = db
    .prepare('SELECT id FROM teacher_unavailability WHERE teacher_id = ? AND day = ? AND period = ?')
    .get(teacherId, day, period);

  if (existing) {
    db.prepare('DELETE FROM teacher_unavailability WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO teacher_unavailability (teacher_id, day, period) VALUES (?, ?, ?)').run(teacherId, day, period);
  }

  res.redirect('/setup?teacher_id=' + teacherId);
});

module.exports = router;
