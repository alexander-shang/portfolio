// Edit PROJECTS below to update project details. Set `demo` to an
// <img>/<iframe> HTML string once you have real screenshots (drop
// images in an assets/ folder next to this file), or leave it null
// for the placeholder. Add real links (GitHub, writeup, live demo)
// in the `links` array.
(function () {
  const PROJECTS = {
    flippability: {
      title: 'House Flippability Model',
      tags: ['ML', 'Data'],
      meta: 'Python',
      body: [
        'From ~17,000 Zillow listings in the Raleigh-Durham-Chapel Hill, we built a model to predict whether a house is likely to be "flippable" (i.e., profitable to buy, renovate, and resell).',
        'After cleaning and transforming the dataset, we evaluated a Random Forest classification model using stratified K-fold cross-validation to ensure each fold maintained a representative distribution of flip and non-flip properties.',
        'The model achieved an accuracy of 97%, indicating strong predictive performance for identifying flippable properties, reducing time spent searching for properties, and increasing the likelihood of profitable investments.',
        'This pipeline can also be applied to other real estate markets, providing a scalable solution for investors looking to identify profitable opportunities in different regions.',
      ],
      demo: '<iframe src="portfolio/assets/zillow.pdf"></iframe>',
      links: [
        { label: 'Python Notebook', href: 'https://github.com/alexander-shang/portfolio/blob/main/assets/zillow.ipynb'},
      ],
    },
    scheduling: {
      title: 'CS Dept. Scheduling Assistant',
      tags: ['AI', 'Full-stack'],
      meta: 'Python, JavaScript, React, PostgreSQL, FastAPI, HTML, CSS, TypeScript',
      body: [
        "An AI-powered office-hours scheduling feature built into the school's CS department site, on a four-person team using GPT-4o's API.",
        'Owned the backend: prompt engineering, testing, and handling inconsistent model outputs.',
      ],
      demo: null,
      links: [],
    },
    ikea: {
      title: 'IKEA Catalogue Assistant',
      tags: ['AI', 'Product'],
      meta: 'TypeScript, JavaScript, HTML, CSS',
      body: [
        "An AI chatbot for interior designed based on IKEA's catalogue to build a more personalized shopping experience.", 
        "The chatbot uses RAGLoader to retrieve information from data scraped from IKEA catalogues, magazines, and public forums, ultimately with the goal of exploring how conversational interfaces can replace faceted search for large, messy product data.",
      ],
      demo: `<video controls>
        <source src="portfolio/assets/chatbot demo.mov" type="video/mp4">
        Your browser does not support the video tag.
        </video>`,
      links: [],
    },
    covid: {
      title: 'Economic Impacts of COVID-19',
      tags: ['Research', 'Data'],
      meta: 'Python',
      body: [
        'A research project analyzing near-term job-loss risk using linked monthly Current Population Survey (CPS) data from 2018–2023.',
        'We examined how unemployment transition risk changed across pre-COVID, COVID, and post-COVID periods, finding that job-loss risk increased sharply during COVID and that vulnerability consistently varied by education, age, and employment status. The analysis also found that the predictors of job loss shifted during the pandemic, highlighting how economic shocks can reshape labor-market risk.',
        'Research and analysis were done via Python, with data cleaning and visualization performed using various libraries including: Pandas, NumPy, and Matplotlib.',
      ],
      demo: '<iframe src="portfolio/assets/covid.pdf"></iframe>',
      links: [
        { label: 'Python Notebook', href: 'https://github.com/alexander-shang/portfolio/blob/main/assets/covid19.ipynb' },
      ],
    },
    environment: {
      title: 'Environment, Crime & Property Value',
      tags: ['Research', 'Econ'],
      meta: '',
      body: [
        'A proposed research study examining how trees contribute to local property values through the reduction of crime rate, based on a similar paper written by Han et. Al.',
      ],
      demo: '<iframe src="portfolio/assets/econ proposal.pdf"></iframe>',
      links: [{label: 'Orginal Paper', href: 'https://www.nber.org/papers/w32063'}],
    },
  };

  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const dialog = modal.querySelector('.modal__dialog');
  const tagsEl = document.getElementById('modal-tags');
  const titleEl = document.getElementById('modal-title');
  const metaEl = document.getElementById('modal-meta');
  const bodyEl = document.getElementById('modal-body');
  const demoEl = document.getElementById('modal-demo');
  const linksEl = document.getElementById('modal-links');

  let lastFocused = null;

  function fillModal(project) {
    tagsEl.innerHTML = project.tags.map((t) => `<span>${t}</span>`).join('');
    titleEl.textContent = project.title;
    metaEl.textContent = project.meta || '';
    metaEl.style.display = project.meta ? '' : 'none';
    bodyEl.innerHTML = project.body.map((p) => `<p>${p}</p>`).join('');

    demoEl.innerHTML = project.demo
      ? project.demo
      : '<div class="modal__demo-placeholder">Screenshots / demo coming soon</div>';

    linksEl.innerHTML = project.links
      .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`)
      .join('');
    linksEl.style.display = project.links.length ? '' : 'none';
  }

  function openModal(id) {
    const project = PROJECTS[id];
    if (!project) return;
    lastFocused = document.activeElement;
    fillModal(project);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.gallery-tile[data-project]').forEach((tile) => {
    tile.addEventListener('click', () => openModal(tile.dataset.project));
  });

  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = dialog.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
