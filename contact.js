(function () {
    const FORM_ENDPOINT = 'https://formspree.io/f/mrpzlzgz';
  
    const form = document.getElementById('contact-form');
    if (!form) return;
  
    const statusEl = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      submitBtn.disabled = true;
      statusEl.dataset.state = '';
      statusEl.textContent = 'Sending…';
  
      try {
        const formData = new FormData(form);
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });
  
        if (res.ok) {
          statusEl.textContent = "Thanks — your message is on its way. I'll get back to you soon.";
          statusEl.dataset.state = 'success';
          form.reset();
        } else {
          const data = await res.json().catch(() => null);
          const msg = data && data.errors && data.errors.length
            ? data.errors.map(er => er.message).join(', ')
            : 'Something went wrong — please try again or email me directly.';
          statusEl.textContent = msg;
          statusEl.dataset.state = 'error';
        }
      } catch (err) {
        statusEl.textContent = 'Network error — please try again or email me directly.';
        statusEl.dataset.state = 'error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  })();