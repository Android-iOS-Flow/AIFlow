// Dashboard: poll status + logs with configurable interval (no websocket needed — runs everywhere).
(function () {
  const $ = (id) => document.getElementById(id);
  let intervalId = null;
  let currentInterval = 2000; // default fallback

  async function refreshStatus() {
    try {
      const s = await fetch("/api/status").then((r) => r.json());
      if ($("s-driver")) $("s-driver").textContent = s.driver;
      if ($("s-active")) $("s-active").textContent = s.active_tasks;
      if ($("s-listeners")) $("s-listeners").textContent = s.listeners;
      setState($("s-device"), s.device && s.device.ok, "● ready", "● not connected");
      setState($("s-trigger"), s.trigger_running, "● listening", "● off");

      // Update interval if changed
      const newInterval = (s.adb_scan_interval || 2) * 1000;
      if (newInterval !== currentInterval) {
        currentInterval = newInterval;
        restartInterval();
      }
    } catch (_) {}
  }

  function setState(el, ok, okText, badText) {
    if (!el) return;
    el.textContent = ok ? okText : badText;
    el.className = ok ? "ok" : "bad";
  }

  async function refreshLogs() {
    const box = $("logbox");
    if (!box) return;
    try {
      const logs = await fetch("/api/logs?limit=200").then((r) => r.json());
      const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
      box.innerHTML = logs
        .map(
          (l) =>
            `<span class="log-${l.level}">${l.time} ${l.level.padEnd(7)} ${escapeHtml(
              l.name
            )} | ${escapeHtml(l.msg)}</span>`
        )
        .join("\n");
      if (atBottom) box.scrollTop = box.scrollHeight;
    } catch (_) {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function tick() {
    refreshStatus();
    refreshLogs();
  }

  function restartInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(tick, currentInterval);
  }

  tick(); // Initial call
  restartInterval();
})();
