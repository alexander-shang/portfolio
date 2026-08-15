document.querySelectorAll('.tabs a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
  
      const activeTab = document.querySelector('.tab--active');
  
      if (activeTab) {
        activeTab.classList.add('is-leaving');
      }
  
      setTimeout(() => {
        window.location.href = link.href;
      }, 250);
    });
  });