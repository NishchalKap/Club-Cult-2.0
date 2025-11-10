import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const eventsRes = http.get(`${__ENV.BASE_URL || 'http://localhost:5000'}/api/events`);

  // pick first event id if available
  let eventId = null;
  try {
    const events = eventsRes.json();
    if (Array.isArray(events) && events.length > 0) {
      eventId = events[0].id;
    }
  } catch (e) {
    // ignore
  }

  if (eventId) {
    http.post(`${__ENV.BASE_URL || 'http://localhost:5000'}/api/events/${eventId}/register`, JSON.stringify({
      name: 'LoadTester',
      email: `load+${Math.random().toString(36).slice(2,7)}@example.com`,
      phone: '9999999999',
      branch: 'CS',
      year: '2nd',
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  sleep(1);
}
