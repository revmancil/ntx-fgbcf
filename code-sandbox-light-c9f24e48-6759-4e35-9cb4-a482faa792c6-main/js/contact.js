/**
 * Contact form — static-hosting friendly (GitHub Pages).
 *
 * HOW IT WORKS
 *  1. If FORMSPREE_ENDPOINT is set, submissions POST to Formspree (free tier: https://formspree.io).
 *     - Create a form at formspree.io, copy the endpoint (looks like https://formspree.io/f/abcdwxyz)
 *       and paste it below. Submissions are emailed to the address you register there.
 *  2. Otherwise, the form falls back to opening the visitor's email app (mailto:) with the
 *     message pre-filled, addressed to FALLBACK_EMAIL.
 */
const FORMSPREE_ENDPOINT = '';                 // e.g. 'https://formspree.io/f/abcdwxyz'
const FALLBACK_EMAIL = 'info@ntxfullgospel.org'; // <-- change to the State office email

(function () {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  function showStatus(type, msg) { status.className = 'form-status ' + type; status.innerHTML = msg; }
  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.innerHTML = busy ? '<i class="fa-solid fa-spinner fa-spin"></i> Sending…' : '<i class="fa-solid fa-paper-plane"></i> Send Message';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '');
    if (!data.name.trim() || !emailOk || !data.topic || !data.message.trim()) {
      showStatus('error', '<i class="fa-solid fa-circle-exclamation"></i> Please complete all required fields with a valid email address.');
      return;
    }

    /* ---- Option 1: Formspree ---- */
    if (FORMSPREE_ENDPOINT) {
      setBusy(true);
      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(), email: data.email.trim(), phone: (data.phone || '').trim(),
            church: (data.church || '').trim(), topic: data.topic, message: data.message.trim(),
            _subject: `[NTX FGBCF Website] ${data.topic} — ${data.name.trim()}`
          })
        });
        if (!res.ok) throw new Error('Formspree ' + res.status);
        form.reset();
        showStatus('success', '<i class="fa-solid fa-circle-check"></i> Thank you! Your message has been received. A member of the North Texas State team will be in touch.');
      } catch (err) {
        console.error(err);
        showStatus('error', '<i class="fa-solid fa-circle-exclamation"></i> Sorry, we could not send your message right now. Please try again shortly or email us directly.');
      } finally { setBusy(false); }
      return;
    }

    /* ---- Option 2: mailto fallback ---- */
    const subject = `[NTX FGBCF Website] ${data.topic} — ${data.name.trim()}`;
    const body =
      `Name: ${data.name.trim()}\nEmail: ${data.email.trim()}\nPhone: ${(data.phone || '').trim()}\n` +
      `Church / Organization: ${(data.church || '').trim()}\nTopic: ${data.topic}\n\n${data.message.trim()}`;
    window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showStatus('success', '<i class="fa-solid fa-envelope-open-text"></i> Your email app should open with your message ready to send. If it doesn’t, email us at <a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.');
  });
})();
