const express = require('express');
const path = require('path');
const db = require('./db');

const setupRouter = require('./routes/setup');
const assignmentsRouter = require('./routes/assignments');
const timetableRouter = require('./routes/timetable');
const substitutesRouter = require('./routes/substitutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers ORDER BY name').all();
  const classes = db.prepare('SELECT * FROM classes ORDER BY name').all();
  const hasTimetable = db.prepare('SELECT COUNT(*) AS c FROM timetable_slots').get().c > 0;

  const today = new Date().toISOString().slice(0, 10);
  const todaysSubstitutions = db
    .prepare(
      `SELECT sub.*, ot.name AS original_teacher_name, st.name AS substitute_teacher_name, c.name AS className, s.name AS subject
       FROM substitutions sub
       JOIN teachers ot ON ot.id = sub.original_teacher_id
       LEFT JOIN teachers st ON st.id = sub.substitute_teacher_id
       JOIN classes c ON c.id = sub.class_id
       JOIN assignments a ON a.id = sub.assignment_id
       JOIN subjects s ON s.id = a.subject_id
       WHERE sub.date = ?
       ORDER BY sub.period`
    )
    .all(today);

  res.render('home', {
    teachers,
    classes,
    hasTimetable,
    todaysSubstitutions,
    success: req.query.success,
    warning: req.query.warning,
    error: req.query.error,
  });
});

app.use('/setup', setupRouter);
app.use('/assignments', assignmentsRouter);
app.use('/timetable', timetableRouter);
app.use('/substitutes', substitutesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TMS running at http://localhost:${PORT}`);
});
