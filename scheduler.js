// Greedy scheduler with round-robin day spreading.
//
// Input:
//   assignments = [{id, teacher_id, subject_id, periods_per_week, class_ids: [...], room_id, max_per_day}]
//     class_ids has more than one entry for a combined period (several
//     classes merged into one shared session, e.g. Sports/Assembly).
//     room_id is optional; when set, that room cannot double-book either.
//     max_per_day is optional; when set, caps how many periods of this
//     assignment can land on the same day.
//   settings = {days: [...], periods_per_day: N, break_periods: [...]}
//     break_periods are period indices that are never scheduled into
//     (lunch, recess, etc) on any day.
//   lockedSlots = [{assignment_id, day, period}] - manually fixed slots that
//     already occupy the grid and must never be touched or duplicated. One
//     entry per (assignment, day, period), not per class.
//   teacherUnavailability = [{teacher_id, day, period}] - hard blocks where
//     that teacher can never be scheduled.
//
// Output: {slots: [{class_id, day, period, assignment_id}], unplaced: [{assignment_id, remaining}]}
// `slots` contains only newly auto-placed periods (one row per class in the
// assignment); locked slots are left exactly as they are in the database.

function generateSchedule(assignments, settings, lockedSlots = [], teacherUnavailability = []) {
  const numDays = settings.days.length;
  const numPeriods = settings.periods_per_day;
  const breakPeriods = new Set(settings.break_periods || []);

  const classBusy = Array.from({ length: numDays }, () => Array.from({ length: numPeriods }, () => new Set()));
  const teacherBusy = Array.from({ length: numDays }, () => Array.from({ length: numPeriods }, () => new Set()));
  const roomBusy = Array.from({ length: numDays }, () => Array.from({ length: numPeriods }, () => new Set()));

  for (const u of teacherUnavailability) {
    if (u.day < numDays && u.period < numPeriods) {
      teacherBusy[u.day][u.period].add(u.teacher_id);
    }
  }

  const byId = new Map(assignments.map((a) => [a.id, a]));

  const dayCounts = new Map(); // assignment_id -> Map(day -> count)
  const dayPeriods = new Map(); // assignment_id -> Map(day -> Set(period))
  const lockedCount = new Map(); // assignment_id -> count

  for (const a of assignments) {
    dayCounts.set(a.id, new Map());
    dayPeriods.set(a.id, new Map());
    lockedCount.set(a.id, 0);
  }

  for (const ls of lockedSlots) {
    const a = byId.get(ls.assignment_id);
    if (!a) continue;

    for (const classId of a.class_ids) {
      classBusy[ls.day][ls.period].add(classId);
    }
    teacherBusy[ls.day][ls.period].add(a.teacher_id);
    if (a.room_id) roomBusy[ls.day][ls.period].add(a.room_id);

    const counts = dayCounts.get(a.id);
    counts.set(ls.day, (counts.get(ls.day) || 0) + 1);

    const periods = dayPeriods.get(a.id);
    if (!periods.has(ls.day)) periods.set(ls.day, new Set());
    periods.get(ls.day).add(ls.period);

    lockedCount.set(a.id, lockedCount.get(a.id) + 1);
  }

  const ordered = [...assignments].sort((a, b) => b.periods_per_week - a.periods_per_week);

  const slots = [];
  const unplaced = [];

  for (const a of ordered) {
    let remaining = a.periods_per_week - (lockedCount.get(a.id) || 0);

    while (remaining > 0) {
      const candidate = findBestSlot(
        a,
        numDays,
        numPeriods,
        breakPeriods,
        classBusy,
        teacherBusy,
        roomBusy,
        dayCounts.get(a.id),
        dayPeriods.get(a.id)
      );

      if (!candidate) break;

      const { day, period } = candidate;

      for (const classId of a.class_ids) {
        classBusy[day][period].add(classId);
        slots.push({ class_id: classId, day, period, assignment_id: a.id });
      }
      teacherBusy[day][period].add(a.teacher_id);
      if (a.room_id) roomBusy[day][period].add(a.room_id);

      const counts = dayCounts.get(a.id);
      counts.set(day, (counts.get(day) || 0) + 1);

      const periods = dayPeriods.get(a.id);
      if (!periods.has(day)) periods.set(day, new Set());
      periods.get(day).add(period);

      remaining -= 1;
    }

    if (remaining > 0) {
      unplaced.push({ assignment_id: a.id, remaining });
    }
  }

  return { slots, unplaced };
}

function findBestSlot(assignment, numDays, numPeriods, breakPeriods, classBusy, teacherBusy, roomBusy, dayCountsForA, dayPeriodsForA) {
  let best = null;
  let bestScore = -Infinity;

  for (let day = 0; day < numDays; day++) {
    const countOnDay = dayCountsForA.get(day) || 0;
    if (assignment.max_per_day && countOnDay >= assignment.max_per_day) continue;

    const periodsUsedOnDay = dayPeriodsForA.get(day);

    for (let period = 0; period < numPeriods; period++) {
      if (breakPeriods.has(period)) continue;

      const classConflict = assignment.class_ids.some((classId) => classBusy[day][period].has(classId));
      if (classConflict) continue;
      if (teacherBusy[day][period].has(assignment.teacher_id)) continue;
      if (assignment.room_id && roomBusy[day][period].has(assignment.room_id)) continue;

      const isAdjacent = periodsUsedOnDay
        ? periodsUsedOnDay.has(period - 1) || periodsUsedOnDay.has(period + 1)
        : false;
      const score = -(countOnDay * 100 + (isAdjacent ? 1 : 0));

      if (score > bestScore) {
        bestScore = score;
        best = { day, period };
      }
    }
  }

  return best;
}

module.exports = { generateSchedule };
