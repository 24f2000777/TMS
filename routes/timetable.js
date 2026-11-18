const express = require('express');
const db = require('../db');
const { generateSchedule } = require('../scheduler');
const { streamTeacherPdf } = require('../pdf');

const router = express.Router();

function getSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  settings.days = JSON.parse(settings.days);
  settings.break_periods = JSON.parse(settings.break_periods || '[]');
  return settings;
}

function loadAssignmentsWithClasses() {
  const assignments = db.prepare('SELECT * FROM assignments').all();
  const classLinks = db.prepare('SELECT * FROM assignment_classes').all();

  const classesByAssignment = new Map();
  for (const link of classLinks) {
    if (!classesByAssignment.has(link.assignment_id)) classesByAssignment.set(link.assignment_id, []);
    classesByAssignment.get(link.assignment_id).push(link.class_id);
  }

  return assignments.map((a) => ({ ...a, class_ids: classesByAssignment.get(a.id) || [] }));
}

router.post('/generate', (req, res) => {
  const assignments = loadAssignmentsWithClasses().filter((a) => a.class_ids.length > 0);
  const settings = getSettings();

  if (assignments.length === 0) {
    return res.redirect('/?error=' + encodeURIComponent('Add some assignments first'));
  }

  const lockedSlots = db
    .prepare('SELECT DISTINCT assignment_id, day, period FROM timetable_slots WHERE locked = 1')
    .all();

  const teacherUnavailability = db.prepare('SELECT teacher_id, day, period FROM teacher_unavailability').all();

  const { slots, unplaced } = generateSchedule(assignments, settings, lockedSlots, teacherUnavailability);

  const insertSlot = db.prepare(
    'INSERT INTO timetable_slots (class_id, day, period, assignment_id, locked) VALUES (?, ?, ?, ?, 0)'
  );

  db.transaction(() => {
    db.prepare('DELETE FROM timetable_slots WHERE locked = 0').run();
    for (const s of slots) {
      insertSlot.run(s.class_id, s.day, s.period, s.assignment_id);
    }
  })();

  if (unplaced.length > 0) {
    const details = unplaced
      .map((u) => {
        const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(u.assignment_id);
        const t = db.prepare('SELECT name FROM teachers WHERE id = ?').get(a.teacher_id);
        const s = db.prepare('SELECT name FROM subjects WHERE id = ?').get(a.subject_id);
        const classNames = db
          .prepare(
            `SELECT c.name FROM classes c JOIN assignment_classes ac ON ac.class_id = c.id WHERE ac.assignment_id = ?`
          )
          .all(a.id)
          .map((c) => c.name)
          .join(' + ');
        return `${t.name} / ${s.name} / ${classNames} (${u.remaining} period(s) could not be placed)`;
      })
      .join('; ');
    return res.redirect('/?warning=' + encodeURIComponent(`Timetable generated, but some periods could not be placed: ${details}`));
  }

  res.redirect('/?success=' + encodeURIComponent('Timetable generated successfully'));
});

function buildClassGrid(classId, settings) {
  const slots = db
    .prepare(
      `SELECT ts.day, ts.period, ts.locked, ts.assignment_id, s.name AS subject, t.name AS teacher, r.name AS room
       FROM timetable_slots ts
       JOIN assignments a ON a.id = ts.assignment_id
       JOIN subjects s ON s.id = a.subject_id
       JOIN teachers t ON t.id = a.teacher_id
       LEFT JOIN rooms r ON r.id = a.room_id
       WHERE ts.class_id = ?`
    )
    .all(classId);

  const otherClassesStmt = db.prepare(
    `SELECT c.name FROM classes c
     JOIN assignment_classes ac ON ac.class_id = c.id
     WHERE ac.assignment_id = ? AND c.id != ?`
  );

  const grid = Array.from({ length: settings.days.length }, () =>
    Array.from({ length: settings.periods_per_day }, () => null)
  );

  for (const slot of slots) {
    const others = otherClassesStmt.all(slot.assignment_id, classId).map((c) => c.name);
    grid[slot.day][slot.period] = {
      subject: slot.subject,
      teacher: slot.teacher,
      room: slot.room,
      locked: !!slot.locked,
      combinedWith: others,
    };
  }

  return grid;
}

function buildTeacherGrid(teacherId, settings) {
  const slots = db
    .prepare(
      `SELECT ts.day, ts.period, ts.locked, ts.assignment_id, ts.class_id, s.name AS subject, c.name AS className, r.name AS room
       FROM timetable_slots ts
       JOIN assignments a ON a.id = ts.assignment_id
       JOIN subjects s ON s.id = a.subject_id
       JOIN classes c ON c.id = ts.class_id
       LEFT JOIN rooms r ON r.id = a.room_id
       WHERE a.teacher_id = ?`
    )
    .all(teacherId);

  const grouped = new Map();
  for (const slot of slots) {
    const key = `${slot.day}:${slot.period}:${slot.assignment_id}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        room: slot.room,
        locked: !!slot.locked,
        classNames: [],
      });
    }
    grouped.get(key).classNames.push(slot.className);
  }

  const grid = Array.from({ length: settings.days.length }, () =>
    Array.from({ length: settings.periods_per_day }, () => null)
  );

  for (const cell of grouped.values()) {
    grid[cell.day][cell.period] = {
      subject: cell.subject,
      className: cell.classNames.join(' + '),
      room: cell.room,
      locked: cell.locked,
    };
  }

  return grid;
}

router.get('/class/:id', (req, res) => {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).send('Class not found');

  const settings = getSettings();
  const grid = buildClassGrid(cls.id, settings);

  res.render('class-timetable', { cls, settings, grid, error: req.query.error });
});

router.get('/teacher/:id', (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) return res.status(404).send('Teacher not found');

  const settings = getSettings();
  const grid = buildTeacherGrid(teacher.id, settings);

  res.render('teacher-timetable', { teacher, settings, grid });
});

router.get('/teacher/:id/pdf', (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) return res.status(404).send('Teacher not found');

  const settings = getSettings();
  const grid = buildTeacherGrid(teacher.id, settings);

  streamTeacherPdf(res, teacher.name, settings.days, settings.periods_per_day, grid);
});

// Manual override: reassign (or clear) a single, unlocked cell on a class's
// grid without running a full regeneration.
router.get('/class/:id/edit/:day/:period', (req, res) => {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).send('Class not found');

  const day = parseInt(req.params.day, 10);
  const period = parseInt(req.params.period, 10);
  const settings = getSettings();

  const existing = db
    .prepare('SELECT * FROM timetable_slots WHERE class_id = ? AND day = ? AND period = ?')
    .get(cls.id, day, period);

  if (existing && existing.locked) {
    return res.redirect('/timetable/class/' + cls.id + '?error=' + encodeURIComponent('That period is locked. Unlock it from Assignments first.'));
  }

  const options = db
    .prepare(
      `SELECT a.id, t.name AS teacher_name, s.name AS subject_name
       FROM assignments a
       JOIN teachers t ON t.id = a.teacher_id
       JOIN subjects s ON s.id = a.subject_id
       JOIN assignment_classes ac ON ac.assignment_id = a.id
       WHERE ac.class_id = ?
       ORDER BY s.name`
    )
    .all(cls.id);

  res.render('edit-slot', {
    cls,
    day,
    period,
    dayName: settings.days[day],
    periodLabel: `P${period + 1}`,
    options,
    currentAssignmentId: existing ? existing.assignment_id : null,
  });
});

router.post('/class/:id/edit/:day/:period', (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const day = parseInt(req.params.day, 10);
  const period = parseInt(req.params.period, 10);
  const assignmentId = req.body.assignment_id ? parseInt(req.body.assignment_id, 10) : null;

  const existing = db
    .prepare('SELECT * FROM timetable_slots WHERE class_id = ? AND day = ? AND period = ?')
    .get(classId, day, period);

  if (existing && existing.locked) {
    return res.redirect('/timetable/class/' + classId + '?error=' + encodeURIComponent('That period is locked.'));
  }

  if (assignmentId) {
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    const classIds = db
      .prepare('SELECT class_id FROM assignment_classes WHERE assignment_id = ?')
      .all(assignmentId)
      .map((r) => r.class_id);

    // Conflict check: the teacher (or room) must be free at this day/period
    // elsewhere, ignoring this exact cell (which we're about to overwrite).
    const conflict = db
      .prepare(
        `SELECT ts.id FROM timetable_slots ts
         JOIN assignments a ON a.id = ts.assignment_id
         WHERE ts.day = ? AND ts.period = ? AND ts.class_id != ?
           AND (a.teacher_id = ? ${assignment.room_id ? 'OR a.room_id = ?' : ''})`
      )
      .get(...(assignment.room_id ? [day, period, classId, assignment.teacher_id, assignment.room_id] : [day, period, classId, assignment.teacher_id]));

    if (conflict) {
      return res.redirect(
        '/timetable/class/' + classId + '?error=' + encodeURIComponent('That teacher or room is already busy at this day/period.')
      );
    }

    db.transaction(() => {
      db.prepare('DELETE FROM timetable_slots WHERE class_id = ? AND day = ? AND period = ?').run(classId, day, period);
      for (const linkedClassId of classIds) {
        if (linkedClassId === classId) {
          db.prepare(
            'INSERT INTO timetable_slots (class_id, day, period, assignment_id, locked) VALUES (?, ?, ?, ?, 0)'
          ).run(linkedClassId, day, period, assignmentId);
        }
      }
    })();
  } else {
    db.prepare('DELETE FROM timetable_slots WHERE class_id = ? AND day = ? AND period = ? AND locked = 0').run(
      classId,
      day,
      period
    );
  }

  res.redirect('/timetable/class/' + classId);
});

module.exports = router;
