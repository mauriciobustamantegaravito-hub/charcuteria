// Reveals observer
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('show');
    io.unobserve(e.target);
  }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(e => io.observe(e));
