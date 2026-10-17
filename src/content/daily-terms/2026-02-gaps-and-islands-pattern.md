---
title: "Gaps and Islands Pattern"
termSlug: "gaps-and-islands-pattern"
year: 2026
month: 2
monthName: "February"
day: 26
order: 19
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Gaps and Islands Pattern is a SQL technique for identifying consecutive sequences (islands) and missing values (gaps) in ordered data. Islands are continuous ranges of values without breaks (e.g.,..."
---
### Definition:

Gaps and Islands Pattern is a SQL technique for identifying consecutive sequences (islands) and missing values (gaps) in ordered data. Islands are continuous ranges of values without breaks (e.g., consecutive dates, sequential IDs), while gaps are the missing values between islands. This pattern commonly uses window functions (ROW_NUMBER(), LEAD(), LAG()) to detect sequence breaks and group consecutive elements, solving problems like finding attendance streaks, missing invoice numbers, or continuous trading days.

**Key Concepts:**

- Islands: Consecutive sequences without breaks (e.g., days 1,2,3,4)
- Gaps: Missing values in what should be consecutive (e.g., missing day 5)
- Common Technique: ROW_NUMBER() difference method
- Use Cases: Attendance tracking, sequence validation, time-series analysis
- Challenge: Standard SQL doesn't have built-in "group consecutive" function

### Example:

Employee Attendance Tracking

```
Sample Data

-- Employee clock-in records
CREATE TABLE attendance (
    employee_id INT,
    attendance_date DATE
);

INSERT INTO attendance VALUES
(101, '2024-01-01'),
(101, '2024-01-02'),
(101, '2024-01-03'),
-- Gap: employee absent on 2024-01-04
(101, '2024-01-05'),
(101, '2024-01-06'),
(101, '2024-01-07'),
-- Gap: employee absent on 2024-01-08
-- Gap: employee absent on 2024-01-09
(101, '2024-01-10'),
(101, '2024-01-11');

-- Visual representation:
-- Jan: ✅✅✅ ❌ ✅✅✅ ❌❌ ✅✅
--      1 2 3  4  5 6 7  8 9 10 11
Finding Islands (Attendance Streaks)

-- Find consecutive attendance periods (islands)

WITH numbered_attendance AS (
    -- Step 1: Assign ROW_NUMBER to each attendance record
    SELECT
        employee_id,
        attendance_date,
        ROW_NUMBER() OVER (
            PARTITION BY employee_id
            ORDER BY attendance_date
        ) as rn
    FROM attendance
),
island_groups AS (
    -- Step 2: Calculate difference to identify islands
    SELECT
        employee_id,
        attendance_date,
        rn,
        -- Magic: DATE - ROW_NUMBER gives same value for consecutive dates
        DATE_SUB(attendance_date, INTERVAL rn DAY) as island_id
    FROM numbered_attendance
)
-- Step 3: Group consecutive days together
SELECT
    employee_id,
    MIN(attendance_date) as streak_start,
    MAX(attendance_date) as streak_end,
    COUNT(*) as consecutive_days
FROM island_groups
GROUP BY employee_id, island_id
ORDER BY streak_start;

/*
Result:
+-------------+--------------+------------+-----------------+
| employee_id | streak_start | streak_end | consecutive_days|
+-------------+--------------+------------+-----------------+
|     101     |  2024-01-01  | 2024-01-03 |        3        | ← Island 1
|     101     |  2024-01-05  | 2024-01-07 |        3        | ← Island 2
|     101     |  2024-01-10  | 2024-01-11 |        2        | ← Island 3
+-------------+--------------+------------+-----------------+

Insights:
- Employee had 3 attendance streaks
- Longest streak: 3 consecutive days (twice)
- Shortest streak: 2 days
*/
Step-by-Step Breakdown:

-- Let's see the magic happening:

SELECT
    employee_id,
    attendance_date,
    ROW_NUMBER() OVER (ORDER BY attendance_date) as rn,
    DATE_SUB(attendance_date, INTERVAL
        ROW_NUMBER() OVER (ORDER BY attendance_date) DAY
    ) as island_id
FROM attendance
WHERE employee_id = 101;

/*
Result (showing the magic):
+-------------+-----------------+----+------------+
| employee_id | attendance_date | rn | island_id  |
+-------------+-----------------+----+------------+
|     101     |   2024-01-01    | 1  | 2023-12-31 | ← Same
|     101     |   2024-01-02    | 2  | 2023-12-31 | ← Same (Island 1)
|     101     |   2024-01-03    | 3  | 2023-12-31 | ← Same
|     101     |   2024-01-05    | 4  | 2024-01-01 | ← Different! (Gap detected)
|     101     |   2024-01-06    | 5  | 2024-01-01 | ← Same
|     101     |   2024-01-07    | 6  | 2024-01-01 | ← Same (Island 2)
|     101     |   2024-01-10    | 7  | 2024-01-03 | ← Different! (Gap detected)
|     101     |   2024-01-11    | 8  | 2024-01-03 | ← Same (Island 3)
+-------------+-----------------+----+------------+

Notice: When attendance_date is consecutive, island_id stays same!
When there's a gap, island_id changes!
*/
Finding Gaps (Missing Attendance Days)

-- Find dates when employee was absent (gaps)

WITH date_range AS (
    -- Step 1: Generate all dates in the range
    SELECT DATE_ADD('2024-01-01', INTERVAL n DAY) as calendar_date
    FROM (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
        UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
        UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) numbers
),
attendance_dates AS (
    -- Step 2: Get actual attendance dates
    SELECT attendance_date
    FROM attendance
    WHERE employee_id = 101
)
-- Step 3: Find dates NOT in attendance (gaps)
SELECT
    dr.calendar_date as absent_date,
    DAYNAME(dr.calendar_date) as day_of_week
FROM date_range dr
LEFT JOIN attendance_dates ad
    ON dr.calendar_date = ad.attendance_date
WHERE ad.attendance_date IS NULL
  AND dr.calendar_date <= '2024-01-11'  -- Don't include future
ORDER BY dr.calendar_date;

/*
Result:
+-------------+-------------+
| absent_date | day_of_week |
+-------------+-------------+
| 2024-01-04  |  Thursday   | ← Gap 1
| 2024-01-08  |  Monday     | ← Gap 2
| 2024-01-09  |  Tuesday    | ← Gap 2 (consecutive gap)
+-------------+-------------+

Insights:
- Employee missed 3 days total
- One single-day absence (Jan 4)
- One two-day absence (Jan 8-9)
*/
Advanced: Finding Longest Attendance Streak

-- Who has the longest consecutive attendance streak?

WITH numbered_attendance AS (
    SELECT
        employee_id,
        attendance_date,
        ROW_NUMBER() OVER (
            PARTITION BY employee_id
            ORDER BY attendance_date
        ) as rn
    FROM attendance
),
island_groups AS (
    SELECT
        employee_id,
        attendance_date,
        DATE_SUB(attendance_date, INTERVAL rn DAY) as island_id
    FROM numbered_attendance
),
streak_summary AS (
    SELECT
        employee_id,
        MIN(attendance_date) as streak_start,
        MAX(attendance_date) as streak_end,
        COUNT(*) as consecutive_days
    FROM island_groups
    GROUP BY employee_id, island_id
)
-- Find longest streak per employee
SELECT
    employee_id,
    streak_start,
    streak_end,
    consecutive_days as longest_streak,
    CONCAT(consecutive_days, ' days from ',
           DATE_FORMAT(streak_start, '%b %d'), ' to ',
           DATE_FORMAT(streak_end, '%b %d')) as description
FROM streak_summary
WHERE consecutive_days = (
    SELECT MAX(consecutive_days)
    FROM streak_summary s2
    WHERE s2.employee_id = streak_summary.employee_id
)
ORDER BY consecutive_days DESC, employee_id;

/*
Result:
+-------------+--------------+------------+---------------+-------------------------+
| employee_id | streak_start | streak_end | longest_streak| description             |
+-------------+--------------+------------+---------------+-------------------------+
|     101     |  2024-01-01  | 2024-01-03 |       3       | 3 days from Jan 01 to   |
|             |              |            |               | Jan 03                   |
+-------------+--------------+------------+---------------+-------------------------+

Use cases:
- Employee recognition (reward longest streaks)
- Attendance compliance reports
- Identify patterns (do people miss Mondays more?)
*/
Finding Gap Ranges (Not Just Individual Gaps)

-- Find ranges of consecutive missing dates

WITH RECURSIVE date_range AS (
    -- Generate date range
    SELECT '2024-01-01' as calendar_date
    UNION ALL
    SELECT DATE_ADD(calendar_date, INTERVAL 1 DAY)
    FROM date_range
    WHERE calendar_date < '2024-01-11'
),
gaps_only AS (
    -- Find dates with no attendance
    SELECT dr.calendar_date
    FROM date_range dr
    LEFT JOIN attendance a
        ON dr.calendar_date = a.attendance_date
        AND a.employee_id = 101
    WHERE a.attendance_date IS NULL
),
numbered_gaps AS (
    -- Assign ROW_NUMBER to gaps
    SELECT
        calendar_date,
        ROW_NUMBER() OVER (ORDER BY calendar_date) as rn
    FROM gaps_only
),
gap_groups AS (
    -- Group consecutive gaps
    SELECT
        calendar_date,
        DATE_SUB(calendar_date, INTERVAL rn DAY) as gap_id
    FROM numbered_gaps
)
-- Summarize gap ranges
SELECT
    MIN(calendar_date) as gap_start,
    MAX(calendar_date) as gap_end,
    COUNT(*) as consecutive_days_missed,
    CASE
        WHEN COUNT(*) = 1 THEN 'Single day absence'
        WHEN COUNT(*) = 2 THEN 'Two consecutive days'
        ELSE CONCAT(COUNT(*), ' consecutive days')
    END as description
FROM gap_groups
GROUP BY gap_id
ORDER BY gap_start;

/*
Result:
+------------+----------+--------------------------+-------------------------+
| gap_start  | gap_end  | consecutive_days_missed  | description             |
+------------+----------+--------------------------+-------------------------+
| 2024-01-04 | 2024-01-04|           1              | Single day absence      |
| 2024-01-08 | 2024-01-09|           2              | Two consecutive days    |
+------------+----------+--------------------------+-------------------------+

This shows:
- One isolated absence (Jan 4)
- One multi-day absence (Jan 8-9)

Useful for:
- Identifying vacation periods vs sick days
- Spotting patterns in absenteeism
- Compliance tracking (e.g., max 2 consecutive days without medical note)
*/
```
