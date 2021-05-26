import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';
import {getPalette} from 'geotiff-palette';

// import {fromArrayBuffer, fromUrl} from 'geotiff';

import GeoRasterLayer from './geotifflayer.js';
//import GeoRaster from './GeoRaster.js';

window.addEventListener('load', async () => {
    let map = L.map('map').setView([34.62, 48.26], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
	
	// var url_to_geotiff_file = "https://geotiff.github.io/georaster-layer-for-leaflet-example/example_4326.tif";
	var url_to_geotiff_file = "./tif/wind_speed.tif";
	// var url_to_geotiff_file = "./tif/img.tif";

function unflatten(valuesInOneDimension, size) {
  const {height, width} = size;
  const valuesInTwoDimensions = [];
  for (let y = 0; y < height; y++) {
    const start = y * width;
    const end = start + width;
    valuesInTwoDimensions.push(valuesInOneDimension.slice(start, end));
  }
  return valuesInTwoDimensions;
}

function processResult(result, debug) {
  const noDataValue = result.noDataValue;
  const height = result.height;
  const width = result.width;

  return new Promise((resolve, reject) => {
    result.maxs = [];
    result.mins = [];
    result.ranges = [];

    let max; let min;

    // console.log("starting to get min, max and ranges");
    for (let rasterIndex = 0; rasterIndex < result.numberOfRasters; rasterIndex++) {
      const rows = result.values[rasterIndex];
      if (debug) console.log('[georaster] rows:', rows);

      for (let rowIndex = 0; rowIndex < height; rowIndex++) {
        const row = rows[rowIndex];

        for (let columnIndex = 0; columnIndex < width; columnIndex++) {
          const value = row[columnIndex];
          if (value != noDataValue && !isNaN(value)) {
            if (typeof min === 'undefined' || value < min) min = value;
            else if (typeof max === 'undefined' || value > max) max = value;
          }
        }
      }

      result.maxs.push(max);
      result.mins.push(min);
      result.ranges.push(max - min);
    }

					console.log('result1:', result);
    resolve(result);
  });
}

	var tm = Date.now();
	fetch(url_to_geotiff_file)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {            
				console.log("arrayBuffer:", arrayBuffer, GeoTIFF);
            //var georaster = 
			GeoTIFF.fromArrayBuffer(arrayBuffer).then(geotiff => {
				console.log("geotiff:", geotiff);
				return geotiff.getImage().then(image => {
					console.log('image:', image);

					const fileDirectory = image.fileDirectory || {};
					const noDataValue = fileDirectory.GDAL_NODATA ? parseFloat(fileDirectory.GDAL_NODATA) : null;

					const { GeographicTypeGeoKey, ProjectedCSTypeGeoKey } = image.getGeoKeys();
					const [resolutionX, resolutionY] = image.getResolution();
					const [originX, originY] = image.getOrigin();
					const width = image.getWidth();
					const height = image.getHeight();
					const result = {
						//        result._data = data.data;

						image: image,
						projection: GeographicTypeGeoKey || ProjectedCSTypeGeoKey,
						width: width,
						height: height,
						pixelHeight: Math.abs(resolutionY),
						pixelWidth: Math.abs(resolutionX),

						xmin: originX,
						ymax: originY,
						noDataValue: noDataValue,
						numberOfRasters: fileDirectory.SamplesPerPixel

					};
					result.xmax = result.xmin + result.width * result.pixelWidth;
					result.ymin = result.ymax - result.height * result.pixelHeight;
					if (fileDirectory.ColorMap) {
					  result.palette = getPalette(image);
					}
					return image.readRasters().then(rasters => {
						result.values = rasters.map(valuesInOneDimension => {
						  return unflatten(valuesInOneDimension, {height, width});
						});
						return processResult(result);
					});
					
					console.log('result:', result);
				});
			}).then(georaster => {
		console.log('georaster', Date.now() - tm, georaster);
				var layer = new GeoRasterLayer({
					georaster: georaster,
					opacity: 0.7
				});
				layer.addTo(map);

				map.fitBounds(layer.getBounds());
			});
            // let gr = new GeoRaster(arrayBuffer);
			// gr.initialize(true);
            /*
GeoTIFF.fromUrl('tif/wind_speed.tif')
	.then(tiff => {
		console.log('tiff', Date.now() - tm, tiff);

			
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