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

**1:1 TA hours** use `type` (and `link` when online). **Group Office Hours** use `inPersonHosts` and `onlineHosts` on a single object (no `type`). The site still shows two cards.

| Key | Required | Type | Expected value |
|---|---|---|---|
| `id` | yes | string | Stable unique id for this slot. Use lowercase letters, numbers, and hyphens. Example: `zeyad-mon` or `group-oh-mon-morning`. |
| `ta` | yes | string | Display name of the TA, or `Group Office Hours` for a group slot. |
| `day` | yes | string | Exact weekday name, capitalized: `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, or `Sunday`. `Mon` or `monday` will not match. |
| `start` | yes | string | Start time in 24-hour `HH:MM`. Hours `00`–`23`, minutes `00`–`59`. Example: `13:00` for 1:00 PM. |
| `end` | yes | string | End time in 24-hour `HH:MM`, same format as `start`. Must be later the same calendar day than `start`. Overnight slots are not supported. |
| `type` | 1:1 only | string | Exactly `in-person` or `online`. Omit on group slots. |
| `location` | yes | string | 1:1 in-person or group: room, e.g. `HAMP 2102`. 1:1 online: `Zoom` or `Teams`. |
| `link` | 1:1 online only | string | Full Zoom or Teams URL, including `https://`. Shown as **Join Zoom** or **Join Teams** while upcoming or running. Omit on in-person 1:1 and on group slots. |
| `inPersonHosts` | group slots | array | In-person TAs for this group slot. Use `[]` until names are known. Omit on 1:1 sessions. |
| `onlineHosts` | group slots | array | Online TAs for this group slot, each with their own link. Use `[]` until names are known. Omit on 1:1 sessions. |

A group slot is any session that has `inPersonHosts` and/or `onlineHosts`. Do not split it into two JSON objects.

### `type` and `link` (1:1)

- `in-person`: show `location` as the room. Do not include `link`.
- `online`: include `link` on the session. Button label is **Join Teams** if `location` is `Teams` or `platform` is `teams`; otherwise **Join Zoom**.

### Group Office Hours

One object per time slot. `location` is the room. Move a TA between online and in person by moving their object between `onlineHosts` and `inPersonHosts`.

```json
{
  "id": "group-oh-mon-morning",
  "ta": "Group Office Hours",
  "day": "Monday",
  "start": "10:30",
  "end": "12:00",
  "location": "HAMP 2102",
  "inPersonHosts": [
    { "ta": "Preston Mo" }
  ],
  "onlineHosts": [
    {
      "ta": "Sarah",
      "platform": "zoom",
      "link": "https://purdue.zoom.us/j/00000000000"
    },
    {
      "ta": "Alex",
      "platform": "teams",
      "link": "https://teams.microsoft.com/l/meetup-join/..."
    }
  ]
}
```

Empty `inPersonHosts` still shows the in-person card (room only). Empty `onlineHosts` hides the online card entirely.

## Hosts

**`inPersonHosts`** objects:

| Key | Required | Type | Expected value |
|---|---|---|---|
| `ta` | yes | string | Display name. |

**`onlineHosts`** objects:

| Key | Required | Type | Expected value |
|---|---|---|---|
| `ta` | yes | string | Display name. |
| `platform` | yes | string | Exactly `zoom` or `teams`. |
| `link` | yes | string | That TA’s meeting URL, including `https://`. |

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
    },
    {
      "id": "group-oh-mon-morning",
      "ta": "Group Office Hours",
      "day": "Monday",
      "start": "10:30",
      "end": "12:00",
      "location": "HAMP 2102",
      "inPersonHosts": [],
      "onlineHosts": []
    }
  ]
}
```
