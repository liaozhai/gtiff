import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';

window.addEventListener('load', async () => {
    let map = L.map('map').setView([34.62, 48.26], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
});