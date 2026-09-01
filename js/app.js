(() => {
  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const REFRESH_MS = 30_000;

  const els = {
    courseCode: document.getElementById("course-code"),
    courseName: document.getElementById("course-name"),
    courseTerm: document.getElementById("course-term"),
    clock: document.getElementById("clock"),
    clockNote: document.getElementById("clock-note"),
    loadStatus: document.getElementById("load-status"),
    happeningNow: document.getElementById("happening-now"),
    happeningNowList: document.getElementById("happening-now-list"),
    comingUp: document.getElementById("coming-up"),
    comingUpList: document.getElementById("coming-up-list"),
    today: document.getElementById("today"),
    todayList: document.getElementById("today-list"),
    thisWeek: document.getElementById("this-week"),
    weekRange: document.getElementById("week-range"),
    weekGrid: document.getElementById("week-grid"),
  };

  let schedule = null;
  let usingOverride = false;

  function parseTimeToMinutes(hhmm) {
    const [hours, minutes] = hhmm.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function formatClockTime(hhmm) {
    const [hours, minutes] = hhmm.split(":").map(Number);
    const dummy = new Date(2000, 0, 1, hours, minutes);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(dummy);
  }

  function formatTimeRange(start, end) {
    return `${formatClockTime(start)}–${formatClockTime(end)}`;
  }

  function formatRelative(totalMinutes) {
    const minutes = Math.max(0, Math.ceil(totalMinutes));
    if (minutes < 1) return "less than a minute";
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    if (hours === 0) return `${remain} min`;
    if (remain === 0) return hours === 1 ? "1 hr" : `${hours} hr`;
    return `${hours} hr ${remain} min`;
  }

  function zoneParts(date, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
    );
    const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
    return {
      weekday: parts.weekday,
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour,
      minute: Number(parts.minute),
      second: Number(parts.second),
    };
  }

  function indianaLocalToDate(isoLocal, timeZone) {
    const [datePart, timePart = "00:00"] = isoLocal.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute = 0, second = 0] = timePart.split(":").map(Number);
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

    const asZoneUtc = (instant) => {
      const parts = zoneParts(new Date(instant), timeZone);
      return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    };

    let utc = desiredAsUtc;
    utc += desiredAsUtc - asZoneUtc(utc);
    utc += desiredAsUtc - asZoneUtc(utc);
    return new Date(utc);
  }

  function getNow(timeZone) {
    const raw = new URLSearchParams(window.location.search).get("now");
    if (!raw) {
      usingOverride = false;
      return new Date();
    }
    usingOverride = true;
    return indianaLocalToDate(raw, timeZone);
  }

  function classify(session, weekday, nowMinutes) {
    if (session.day !== weekday) return "later-week";
    const start = parseTimeToMinutes(session.start);
    const end = parseTimeToMinutes(session.end);
    if (nowMinutes >= start && nowMinutes < end) return "running";
    if (nowMinutes < start) return "upcoming";
    return "finished";
  }

  function showZoom(session, status) {
    return session.type === "online" && session.link && (status === "running" || status === "upcoming");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function locationMarkup(session, status) {
    if (session.type === "online") {
      const pill = `<span class="pill online">Online · ${escapeHtml(session.location || "Zoom")}</span>`;
      const link = showZoom(session, status)
        ? `<a class="zoom-link" href="${escapeHtml(session.link)}" target="_blank" rel="noopener noreferrer">Join Zoom</a>`
        : "";
      return `${pill}${link}`;
    }
    return `<span class="pill">In person · ${escapeHtml(session.location)}</span>`;
  }

  function cardHtml(session, status, nowMinutes, { featured = false } = {}) {
    const start = parseTimeToMinutes(session.start);
    const end = parseTimeToMinutes(session.end);
    let relative = "";
    let badge = "";
    if (status === "running") {
      relative = `<p class="relative">Ends in ${formatRelative(end - nowMinutes)}</p>`;
    } else if (status === "upcoming") {
      relative = `<p class="relative">Starts in ${formatRelative(start - nowMinutes)}</p>`;
    } else if (status === "finished") {
      relative = `<p class="relative ended-copy">This office hour has ended</p>`;
      badge = `<span class="status-badge ended">Ended</span>`;
    }

    const classes = ["card"];
    if (featured) classes.push("card-now");
    if (status === "finished") classes.push("finished");

    return `
      <article class="${classes.join(" ")}">
        <div class="card-top">
          <div>
            <p class="ta">${escapeHtml(session.ta)}</p>
            <p class="time">${formatTimeRange(session.start, session.end)}</p>
          </div>
          ${badge}
        </div>
        <div class="meta">${locationMarkup(session, status)}</div>
        ${relative}
      </article>
    `;
  }

  function weekDates(parts) {
    const todayIndex = DAYS.indexOf(parts.weekday);
    const todayUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
    return DAYS.map((name, index) => {
      const date = new Date(todayUtc + (index - todayIndex) * 86400000);
      return {
        name,
        date: date.getUTCDate(),
        year: date.getUTCFullYear(),
        monthShort: new Intl.DateTimeFormat("en-US", {
          month: "short",
          timeZone: "UTC",
        }).format(date),
      };
    });
  }

  function formatWeekRange(days) {
    const first = days[0];
    const last = days[6];
    if (first.monthShort === last.monthShort && first.year === last.year) {
      return `${first.monthShort} ${first.date}–${last.date}, ${first.year}`;
    }
    if (first.year === last.year) {
      return `${first.monthShort} ${first.date} – ${last.monthShort} ${last.date}, ${last.year}`;
    }
    return `${first.monthShort} ${first.date}, ${first.year} – ${last.monthShort} ${last.date}, ${last.year}`;
  }

  function weekSessionHtml(session) {
    const classes = ["cal-event"];
    if (session.type === "online") classes.push("online");
    if (session.status === "running") classes.push("running");
    if (session.status === "finished") classes.push("finished");

    const typeLabel =
      session.type === "online"
        ? escapeHtml(session.location || "Zoom")
        : escapeHtml(session.location);

    let statusLabel = "";
    if (session.status === "finished") {
      statusLabel = `<span class="cal-status">Ended</span>`;
    } else if (session.status === "running") {
      statusLabel = `<span class="cal-status now">Now</span>`;
    }

    return `
      <article class="${classes.join(" ")}">
        <p class="cal-time"><span>${formatTimeRange(session.start, session.end)}</span>${statusLabel}</p>
        <p class="cal-ta">${escapeHtml(session.ta)}</p>
        <p class="cal-loc">${typeLabel}</p>
      </article>
    `;
  }

  function renderClock(parts) {
    const dummy = new Date(2000, 0, 1, parts.hour, parts.minute);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(dummy);
    els.clock.textContent = `${parts.weekday} · ${time}`;
    els.clockNote.hidden = !usingOverride;
  }

  function fillList(section, list, html, emptyText) {
    section.hidden = false;
    list.innerHTML = html || `<p class="empty">${emptyText}</p>`;
  }

  function render(now) {
    const timeZone = schedule.timezone || "America/Indiana/Indianapolis";
    const parts = zoneParts(now, timeZone);
    const nowMinutes = parts.hour * 60 + parts.minute + parts.second / 60;

    renderClock(parts);

    const sessions = schedule.sessions.map((session) => ({
      ...session,
      status: classify(session, parts.weekday, nowMinutes),
      startMin: parseTimeToMinutes(session.start),
    }));

    const running = sessions
      .filter((session) => session.status === "running")
      .sort((a, b) => a.startMin - b.startMin);
    const upcoming = sessions
      .filter((session) => session.status === "upcoming")
      .sort((a, b) => a.startMin - b.startMin);
    const today = sessions
      .filter((session) => session.day === parts.weekday)
      .sort((a, b) => a.startMin - b.startMin);

    fillList(
      els.happeningNow,
      els.happeningNowList,
      running.map((session) => cardHtml(session, "running", nowMinutes, { featured: true })).join(""),
      "No office hours right now."
    );

    fillList(
      els.comingUp,
      els.comingUpList,
      upcoming.map((session) => cardHtml(session, "upcoming", nowMinutes)).join(""),
      "No more office hours later today."
    );

    fillList(
      els.today,
      els.todayList,
      today.map((session) => cardHtml(session, session.status, nowMinutes)).join(""),
      "No office hours scheduled today."
    );

    const weekdaySessions = Object.fromEntries(DAYS.map((day) => [day, []]));
    for (const session of sessions) {
      weekdaySessions[session.day].push(session);
    }
    for (const day of DAYS) {
      weekdaySessions[day].sort((a, b) => a.startMin - b.startMin);
    }

    const days = weekDates(parts);
    els.thisWeek.hidden = false;
    els.weekRange.textContent = formatWeekRange(days);
    els.weekGrid.innerHTML = days
      .map((day) => {
        const items = weekdaySessions[day.name];
        const weekend = day.name === "Saturday" || day.name === "Sunday" ? " weekend" : "";
        const todayClass = day.name === parts.weekday ? " today" : "";
        const body = items.length
          ? items.map(weekSessionHtml).join("")
          : `<p class="cal-empty">No office hours</p>`;
        return `
        <div class="cal-day${todayClass}${weekend}" role="gridcell">
          <div class="cal-head">
            <p class="cal-dow">${day.name.slice(0, 3)}</p>
            <p class="cal-date">${day.date}</p>
          </div>
          <div class="cal-events">${body}</div>
        </div>
      `;
      })
      .join("");
  }

  function tick() {
    if (!schedule) return;
    render(getNow(schedule.timezone));
  }

  async function init() {
    try {
      const response = await fetch("./data/office-hours.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Could not load schedule (${response.status})`);
      }
      schedule = await response.json();
      els.courseCode.textContent = schedule.course.code;
      els.courseName.textContent = schedule.course.name;
      els.courseTerm.textContent = schedule.course.term || "";
      document.title = `${schedule.course.code} Office Hours`;
      els.loadStatus.hidden = true;
      tick();
      window.setInterval(tick, REFRESH_MS);
    } catch (error) {
      els.loadStatus.classList.add("error");
      els.loadStatus.textContent =
        "Could not load office hours. Serve this folder over HTTP (for example npx serve .) instead of opening the file directly.";
      console.error(error);
    }
  }

  init();
})();
