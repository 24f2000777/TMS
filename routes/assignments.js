const express = require('express');
const db = require('../db');

const router = express.Router();

function getSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  settings.days = JSON.parse(settings.days);
  return settings;
}

function loadAssignmentsForDisplay() {
  return db
    .prepare(
      `SELECT a.id, a.periods_per_week, a.max_per_day, t.name AS teacher_name, s.name AS subject_name,
              r.name AS room_name,
              GROUP_CONCAT(c.name, ' + ') AS class_names
       FROM assignments a
       JOIN teachers t ON t.id = a.teacher_id
       JOIN subjects s ON s.id = a.subject_id
       LEFT JOIN rooms r ON r.id = a.room_id
       JOIN assignment_classes ac ON ac.assignment_id = a.id
       JOIN classes c ON c.id = ac.class_id
       GROUP BY a.id
       ORDER BY s.name, t.name`
    )
    .all();
}

function loadLockedSlots(settings) {
  const rows = db
    .prepare(
      `SELECT ts.id, ts.day, ts.period, ts.assignment_id, t.name AS teacher_name, s.name AS subject_name,
              GROUP_CONCAT(c.name, ' + ') AS class_names
       FROM timetable_slots ts
       JOIN assignments a ON a.id = ts.assignment_id
       JOIN teachers t ON t.id = a.teacher_id
       JOIN subjects s ON s.id = a.subject_id
       JOIN classes c ON c.id = ts.class_id
       WHERE ts.locked = 1
       GROUP BY ts.assignment_id, ts.day, ts.period
       ORDER BY ts.day, ts.period`
    )
    .all();

  return rows.map((r) => ({ ...r, day_name: settings.days[r.day], period_label: `P${r.period + 1}` }));
}

router.get('/', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers ORDER BY name').all();
  const subjects = db.prepare('SELECT * FROM subjects ORDER BY name').all();
  const classes = db.prepare('SELECT * FROM classes ORDER BY name').all();
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY name').all();
  const settings = getSettings();

  const assignments = loadAssignmentsForDisplay();
  const lockableAssignments = loadAssignmentsForDisplay(); // same shape, used in the lock form dropdown
  const lockedSlots = loadLockedSlots(settings);

  res.render('assignments', {
    teachers,
    subjects,
    classes,
    rooms,
    settings,
    assignments,
    lockableAssignments,
    lockedSlots,
    error: req.query.error,
  });
});

router.post('/', (req, res) => {
  const teacherId = parseInt(req.body.teacher_id, 10);
  const subjectId = parseInt(req.body.subject_id, 10);
  const periodsPerWeek = parseInt(req.body.periods_per_week, 10);
  const classIds = [].concat(req.body.class_ids || []).map((id) => parseInt(id, 10)).filter(Boolean);
  const roomId = req.body.room_id ? parseInt(req.body.room_id, 10) : null;
  const maxPerDay = req.body.max_per_day ? parseInt(req.body.max_per_day, 10) : null;

  if (!teacherId || !subjectId || classIds.length === 0 || !periodsPerWeek || periodsPerWeek <= 0) {
    return res.redirect(
      '/assignments?error=' + encodeURIComponent('Teacher, subject, at least one class, and periods/week are required')
    );
  }

  const insertAssignment = db.prepare(
    'INSERT INTO assignments (teacher_id, subject_id, periods_per_week, room_id, max_per_day) VALUES (?, ?, ?, ?, ?)'
  );
  const insertLink = db.prepare('INSERT INTO assignment_classes (assignment_id, class_id) VALUES (?, ?)');

  db.transaction(() => {
    const { lastInsertRowid } = insertAssignment.run(teacherId, subjectId, periodsPerWeek, roomId, maxPerDay);
    for (const classId of classIds) {
      insertLink.run(lastInsertRowid, classId);
    }
  })();

  res.redirect('/assignments');
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.redirect('/assignments');
});

// Lock a specific day/period for an existing assignment (fixed timetable slot).
router.post('/lock', (req, res) => {
  const assignmentId = parseInt(req.body.assignment_id, 10);
  const day = parseInt(req.body.day, 10);
  const period = parseInt(req.body.period, 10);

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
  if (!assignment || Number.isNaN(day) || Number.isNaN(period)) {
    return res.redirect('/assignments?error=' + encodeURIComponent('Pick an assignment, day, and period'));
  }

  const classIds = db
    .prepare('SELECT class_id FROM assignment_classes WHERE assignment_id = ?')
    .all(assignmentId)
    .map((r) => r.class_id);

  // Conflict check against other locked slots: same teacher already locked
  // at this day/period, or one of this assignment's classes already locked.
  const conflict = db
    .prepare(
      `SELECT ts.id FROM timetable_slots ts
       JOIN assignments a ON a.id = ts.assignment_id
       WHERE ts.locked = 1 AND ts.day = ? AND ts.period = ?
         AND (a.teacher_id = ? OR ts.class_id IN (${classIds.map(() => '?').join(',')}))`
    )
    .get(day, period, assignment.teacher_id, ...classIds);

  if (conflict) {
    return res.redirect(
      '/assignments?error=' + encodeURIComponent('That day/period already has a locked slot for this teacher or one of these classes')
    );
  }

  const insertSlot = db.prepare(
    'INSERT INTO timetable_slots (class_id, day, period, assignment_id, locked) VALUES (?, ?, ?, ?, 1)'
  );

  db.transaction(() => {
    for (const classId of classIds) {
      insertSlot.run(classId, day, period, assignmentId);
    }
  })();

  res.redirect('/assignments');
});

router.post('/lock/:assignmentId/:day/:period/unlock', (req, res) => {
  const { assignmentId, day, period } = req.params;
  db.prepare('DELETE FROM timetable_slots WHERE assignment_id = ? AND day = ? AND period = ? AND locked = 1').run(
    assignmentId,
    day,
    period
  );
  res.redirect('/assignments');
});

module.exports = router;
