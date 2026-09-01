# Office hours JSON

This file is the schema for [`office-hours.json`](office-hours.json). Edit that JSON when TAs, times, rooms, or Zoom links change. The site reads it as written; invalid JSON will fail to load.

Times are **West Lafayette local time**. Do not convert them to UTC or to your own timezone.

JSON does not allow comments. This markdown file is the documentation.

## Root object

| Key | Required | Type | Expected value |
|---|---|---|---|
| `course` | yes | object | Course header shown at the top of the page. See [Course](#course). |
| `timezone` | yes | string | IANA timezone used to decide what is happening now. Must be `America/Indiana/Indianapolis` for West Lafayette. |
| `sessions` | yes | array of objects | Recurring weekly office hours. Empty array `[]` is valid and shows no sessions. See [Session](#session). |

There is no `exceptions` array in v1. Cancellations and one-off moves are not supported yet.

## Course

| Key | Required | Type | Expected value |
|---|---|---|---|
| `code` | yes | string | Short course code, e.g. `ECE 301`. Shown as the page title. |
| `name` | yes | string | Course name, e.g. `Signals and Systems`. |
| `term` | no | string | Term label, e.g. `Fall 2026`. Omit or use `""` to hide it. |

## Session

Each entry is one recurring slot on one weekday. If a TA has two different times, or the same time on two days, use two objects.

| Key | Required | Type | Expected value |
|---|---|---|---|
| `id` | yes | string | Stable unique id for this slot. Use lowercase letters, numbers, and hyphens. Example: `zeyad-mon`. Keep it unchanged if you later add cancellations. |
| `ta` | yes | string | Display name of the TA. |
| `day` | yes | string | Exact weekday name, capitalized: `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, or `Sunday`. `Mon` or `monday` will not match. |
| `start` | yes | string | Start time in 24-hour `HH:MM`. Hours `00`–`23`, minutes `00`–`59`. Example: `13:00` for 1:00 PM. |
| `end` | yes | string | End time in 24-hour `HH:MM`, same format as `start`. Must be later the same calendar day than `start`. Overnight slots are not supported. |
| `type` | yes | string | Exactly `in-person` or `online`. Any other value is treated as in-person. |
| `location` | yes | string | Room or meeting label. For in-person use a room, e.g. `MSEE 189`. For online use `Zoom` (or another label). If omitted on an online session, the UI falls back to `Zoom`. |
| `link` | online only | string | Full Zoom (or other) URL, including `https://`. Shown as **Join Zoom** only while the session is upcoming or running. Omit on in-person sessions. |

### `type` and `link`

- `in-person`: show `location` as the room. Do not include `link`.
- `online`: show `location` as the meeting label, and include `link` so students can join while the session is live or about to start.

### Time format

Use two-digit hours and minutes:

```text
09:00   valid
9:00    avoid
13:00   1:00 PM
17:30   5:30 PM
```

A session is **running** when West Lafayette time is on that `day` and `start <= now < end`.

## Example

```json
{
  "course": {
    "code": "ECE 301",
    "name": "Signals and Systems",
    "term": "Fall 2026"
  },
  "timezone": "America/Indiana/Indianapolis",
  "sessions": [
    {
      "id": "zeyad-mon",
      "ta": "Zeyad",
      "day": "Monday",
      "start": "13:00",
      "end": "15:00",
      "type": "in-person",
      "location": "MSEE 189"
    },
    {
      "id": "sarah-tue",
      "ta": "Sarah",
      "day": "Tuesday",
      "start": "17:00",
      "end": "18:00",
      "type": "online",
      "location": "Zoom",
      "link": "https://purdue.zoom.us/j/00000000000"
    }
  ]
}
```
