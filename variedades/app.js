// Reveals observer
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('show');
    io.unobserve(e.target);
  }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(e => io.observe(e));

// Protagonista visual
const path = location.pathname;
const hero = document.querySelector('.variety-hero');
const protagonist = path.includes('picante') ? 'picante-protagonista.png' : path.includes('jamonado') ? 'jamonado-protagonista.png' : 'cervecero-protagonista.png';
if (hero) {
  const p = document.createElement('div');
  p.className = 'variety-protagonist';
  p.innerHTML = '<img src="../assets/protagonistas/' + protagonist + '" alt="Norato embutido artesanal"><span class="orbit" aria-hidden="true"></span><span class="protagonist-label">Norato Artesanal</span>';
  hero.appendChild(p);
}
