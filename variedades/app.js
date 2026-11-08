// Reveals observer (activación visible hacia la mitad de la pantalla)
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('show');
    io.unobserve(e.target);
  }
}), { threshold: 0.12, rootMargin: '0px 0px -18% 0px' });
document.querySelectorAll('.reveal').forEach(e => {
  const rect = e.getBoundingClientRect();
  if (rect.top <= window.innerHeight * 0.50 && rect.bottom >= 0) {
    e.classList.add('show');
  } else {
    io.observe(e);
  }
});
