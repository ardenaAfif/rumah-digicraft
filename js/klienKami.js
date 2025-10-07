const logos = [
  { src: "Assets/clients/baja_logo.png", alt: "BAJA"},
  { src: "Assets/clients/unida_logo.png", alt: "UNIDA Gontor"},
  { src: "Assets/clients/nafta_logo.png", alt: "NAFTA"},
  { src: "Assets/clients/zidanish-furniture_logo.png", alt: "Zidanish Furniture"},
  { src: "Assets/clients/tajwidify_logo.png", alt: "Tajwidify"},
  { src: "Assets/clients/elqirasy_gontory_logo.png", alt: "El Qirasy Gontory"},
  { src: "Assets/clients/geo-air_logo.png", alt: "Geo Air"},
  { src: "Assets/clients/baretho-store_logo.png", alt: "Baretho Store"},
  { src: "Assets/clients/tabungan_qurban_logo.png", alt: "Tabungan Qurban-Q"},
];

function generateClientItems(items) {
    return items.map(item => `
      <li class="client-item shrink-0">
        <a class="inline-flex items-center" target="_blank" rel="noopener">
          <img class="client-logo" src="${item.src}" alt="${item.alt}">
        </a>
      </li>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('clients-track');

    if (!track) return;
    
    const repeatedLogos = logos.concat(logos).concat(logos).concat(logos).concat(logos).concat(logos);
    
    track.innerHTML = generateClientItems(repeatedLogos);
});