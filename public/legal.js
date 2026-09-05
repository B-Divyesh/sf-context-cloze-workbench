document.querySelector('.skip-link')?.addEventListener('click', () => {
  setTimeout(() => document.querySelector('#main')?.focus(), 0);
});
