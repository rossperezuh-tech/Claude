/* Offer form, FAQ and tracking. SITE is injected by the build (endpoint, phone, tracking ids). */
(function () {
  var cur = 1;
  var sending = false;
  var LABELS = ['', 'Step 1 of 3 — Property Info', 'Step 2 of 3 — Property Situation', 'Step 3 of 3 — Your Contact Info'];

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }
  function picked(group) { var el = document.querySelector('#' + group + ' .selected'); return el ? el.textContent : ''; }
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  // Remember how the visitor arrived, so every lead says which ad or page produced it.
  function attribution() {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('attr') || '{}'); } catch (e) {}
    if (!saved.landing_page) {
      var q = new URLSearchParams(location.search);
      saved.landing_page = location.pathname;
      saved.referrer = document.referrer || '';
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'].forEach(function (k) {
        if (q.get(k)) saved[k] = q.get(k);
      });
      try { sessionStorage.setItem('attr', JSON.stringify(saved)); } catch (e) {}
    }
    return saved;
  }

  window.goStep = function (n) {
    $('fs' + cur).classList.remove('active');
    $('fs' + n).classList.add('active');
    ['p1', 'p2', 'p3'].forEach(function (id, i) { $(id).classList.toggle('done', i < n); });
    var parts = LABELS[n].split('—');
    $('prog-label').innerHTML = '<b>' + parts[0].trim() + '</b> — ' + parts[1].trim();
    if (n > cur) track('form_step', { step: n });
    cur = n;
    $('get-offer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.selectRadio = function (groupId, el) {
    $(groupId).querySelectorAll('.radio-btn').forEach(function (b) { b.classList.remove('selected'); });
    el.classList.add('selected');
  };

  function showError(msg) {
    var box = $('form-error');
    box.innerHTML = msg;
    box.style.display = msg ? 'block' : 'none';
  }

  window.submitForm = async function () {
    if (sending) return;
    var phoneDigits = val('phone').replace(/\D/g, '');
    var email = val('email');
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (phoneDigits.length < 10 && !emailOk) {
      showError('Please enter a phone number or an email address so we can send your offer.');
      return;
    }
    if (val('company_site')) return; // spam bots fill hidden fields; people never see this one

    var a = attribution();
    var data = {
      address: val('address'),
      city: val('city'),
      state: val('state'),
      sqft: val('sqft'),
      prop_type: val('ptype'),
      asking_price: val('price'),
      loan: picked('loan-group'),
      occupancy: picked('occ-group'),
      condition: picked('cond-group'),
      first_name: val('fname'),
      last_name: val('lname'),
      phone: val('phone'),
      email: email,
      notes: val('notes'),
      submitted_from: location.pathname,
      market_page: document.body.getAttribute('data-market') || '',
      landing_page: a.landing_page || '',
      referrer: a.referrer || '',
      utm_source: a.utm_source || '',
      utm_medium: a.utm_medium || '',
      utm_campaign: a.utm_campaign || '',
      utm_term: a.utm_term || '',
      gclid: a.gclid || '',
      _subject: 'New warehouse lead: ' + [val('city'), val('state')].filter(Boolean).join(', ')
    };

    var btn = $('submit-btn');
    var label = btn.textContent;
    sending = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    showError('');

    try {
      var res = await fetch(SITE.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Form service answered ' + res.status);
    } catch (e) {
      // The lead did NOT go through. Say so and give the seller another way to reach us.
      console.error('Form error:', e);
      sending = false;
      btn.disabled = false;
      btn.textContent = label;
      showError('We couldn\'t send that just now. Please try again, or call <a href="tel:' + SITE.phoneTel + '">' + SITE.phone + '</a> and we\'ll take your details by phone.');
      track('form_error', {});
      return;
    }

    ['fs1', 'fs2', 'fs3'].forEach(function (id) { $(id).classList.remove('active'); });
    $('success').style.display = 'block';
    document.querySelector('.progress-track').style.display = 'none';
    $('prog-label').style.display = 'none';
    document.querySelector('.form-header h2').textContent = 'THANK YOU!';
    document.querySelector('.form-header p').textContent = "We'll be in touch within 24 hours.";

    track('generate_lead', { market_page: data.market_page, prop_type: data.prop_type });
    if (SITE.googleAdsId && SITE.googleAdsLeadLabel) {
      track('conversion', { send_to: SITE.googleAdsId + '/' + SITE.googleAdsLeadLabel });
    }
  };

  window.toggleFaq = function (el) {
    var item = el.parentElement;
    var open = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
    if (!open) item.classList.add('open');
  };

  document.addEventListener('DOMContentLoaded', function () {
    attribution();

    // Market pages arrive with the state and property type already chosen.
    var b = document.body;
    var st = b.getAttribute('data-state');
    var pt = b.getAttribute('data-ptype');
    var cityHint = b.getAttribute('data-city');
    if (st && $('state')) $('state').value = st;
    if (pt && $('ptype')) $('ptype').value = pt;
    if (cityHint && $('city')) $('city').placeholder = cityHint;

    var p = $('phone');
    if (p) p.addEventListener('input', function () {
      var v = this.value.replace(/\D/g, '');
      if (v.length >= 10) v = '(' + v.slice(0, 3) + ') ' + v.slice(3, 6) + '-' + v.slice(6, 10);
      this.value = v;
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () {
        track('phone_click', { page: location.pathname });
        if (SITE.googleAdsId && SITE.googleAdsCallLabel) {
          track('conversion', { send_to: SITE.googleAdsId + '/' + SITE.googleAdsCallLabel });
        }
      });
    });
  });
})();
