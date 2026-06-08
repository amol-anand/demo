import * as api from './utils.js';

const missingContext = document.getElementById('missing-context');
const formWrap = document.getElementById('schedule-form-wrap');
const pathValue = document.getElementById('target-path-value');
const siteValue = document.getElementById('target-site-value');
const timeInput = document.getElementById('schedule-time');
const timezoneLabel = document.getElementById('schedule-timezone');
const statusText = document.getElementById('status-text');
const scheduleBtn = document.getElementById('schedule-btn');
const manageBtn = document.getElementById('manage-btn');

const { org, site, path } = api.parseSidekickParams(window.location.search);

let cachedUserEmail = '';

async function fetchUserEmailFromSidekick() {
  return new Promise((resolve) => {
    let timeoutId;

    const handler = (event) => {
      const profile = event.data?.status?.profile
        || event.data?.detail?.profile
        || event.data?.profile;
      if (profile?.email) {
        clearTimeout(timeoutId);
        window.removeEventListener('message', handler);
        resolve(profile.email);
      }
    };

    timeoutId = setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve('');
    }, 3000);

    window.addEventListener('message', handler);

    if (window.parent !== window) {
      window.parent.postMessage({ action: 'getStatus' }, '*');
    }
  });
}

async function getUserEmail() {
  if (cachedUserEmail) {
    return cachedUserEmail;
  }

  let email = await api.fetchUserEmail(org, site);

  if (!email) {
    email = await fetchUserEmailFromSidekick();
  }

  if (email) {
    cachedUserEmail = email;
  }

  return email;
}

function setStatus(message, kind = 'info') {
  statusText.textContent = message || '';
  if (message) {
    statusText.dataset.kind = kind;
  } else {
    delete statusText.dataset.kind;
  }
}

function disableForm(busy) {
  scheduleBtn.disabled = busy || !timeInput.value;
  timeInput.disabled = busy;
  manageBtn.disabled = busy;
}

function autoClose() {
  setTimeout(() => window.close(), 3000);
}

async function handleSchedule() {
  setStatus('');
  setStatus('Fetching user profile…');
  const userId = await getUserEmail();
  if (!userId) {
    setStatus('Could not get user profile. Please ensure you are signed in via the Sidekick.', 'warning');
    return;
  }

  if (!api.isAtLeastFiveMinAhead(timeInput.value)) {
    setStatus('Pick a date/time at least 5 minutes in the future.', 'warning');
    return;
  }

  disableForm(true);
  setStatus('Previewing page…');
  const preview = await api.ensurePreview(org, site, path);
  if (!preview.ok) {
    setStatus(preview.error, 'warning');
    disableForm(false);
    return;
  }

  setStatus('Scheduling…');
  const scheduledPublish = new Date(timeInput.value).toISOString();
  const result = await api.schedulePage({
    org, site, path, userId, scheduledPublish,
  });

  if (!result.ok) {
    setStatus(result.error, 'warning');
    disableForm(false);
    return;
  }

  const formatted = new Date(scheduledPublish).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  setStatus(`Scheduled for ${formatted}.`, 'success');
  autoClose();
}

function handleManage() {
  const manageUrl = new URL('scheduler.html', window.location.href);
  manageUrl.searchParams.set('owner', org);
  manageUrl.searchParams.set('repo', site);
  window.open(manageUrl.toString(), '_blank', 'width=900,height=600');
}

async function initContext() {
  if (!org || !site || !path) {
    formWrap.hidden = true;
    missingContext.hidden = false;
    return;
  }
  pathValue.textContent = path;
  siteValue.textContent = `${org}/${site}`;
  timezoneLabel.textContent = `(${Intl.DateTimeFormat().resolvedOptions().timeZone})`;

  getUserEmail();
}

timeInput.addEventListener('input', () => {
  scheduleBtn.disabled = !timeInput.value;
  setStatus('');
});
scheduleBtn.addEventListener('click', handleSchedule);
manageBtn.addEventListener('click', handleManage);

initContext();
