import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';
import GeoRasterLayer from './geotifflayer.js';
//import 'georaster/src/index.js';

window.addEventListener('load', async () => {
    let map = L.map('map').setView([34.62, 48.26], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
	
	var url_to_geotiff_file = "https://geotiff.github.io/georaster-layer-for-leaflet-example/example_4326.tif";

	fetch(url_to_geotiff_file)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            console.log("arrayBuffer:", window.parseGeoraster, arrayBuffer);
            /*
          GeoRaster.parseGeoraster(arrayBuffer).then(georaster => {
            console.log("georaster:", georaster);

                GeoRasterLayer is an extension of GridLayer,
                which means can use GridLayer options like opacity.

                Just make sure to include the georaster option!

                http://leafletjs.com/reference-1.2.0.html#gridlayer
            var layer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.7
            });
            layer.addTo(map);

            map.fitBounds(layer.getBounds());

        });
            */
	});
});