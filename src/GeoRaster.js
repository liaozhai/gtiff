export default class GeoRaster {
    constructor(data, metadata, debug) {
      if (debug) console.log('starting GeoRaster.constructor with', data, metadata);
  
      this._web_worker_is_available = typeof window !== 'undefined' && window.Worker !== 'undefined';
      this._blob_is_available = typeof Blob !== 'undefined';
      this._url_is_available = typeof URL !== 'undefined';
  
      // check if should convert to buffer
      if (typeof data === 'object' && data.constructor && data.constructor.name === 'Buffer' && Buffer.isBuffer(data) === false) {
        data = new Buffer(data);
      }
  
      if (typeof data === 'string') {
        if (debug) console.log('data is a url');
        this._data = data;
        this._url = data;
        this.rasterType = 'geotiff';
        this.sourceType = 'url';
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
        // this is node
        if (debug) console.log('data is a buffer');
        this._data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        this.rasterType = 'geotiff';
        this.sourceType = 'Buffer';
      } else if (data instanceof ArrayBuffer) {
        // this is browser
        this._data = data;
        this.rasterType = 'geotiff';
        this.sourceType = 'ArrayBuffer';
      } else if (Array.isArray(data) && metadata) {
        this._data = data;
        this.rasterType = 'object';
        this._metadata = metadata;
      }
  
      if (debug) console.log('this after construction:', this);
    }
  
    preinitialize(debug) {
      if (debug) console.log('starting preinitialize');
      if (this._url) {
        // initialize these outside worker to avoid weird worker error
        // I don't see how cache option is passed through with fromUrl,
        // though constantinius says it should work: https://github.com/geotiffjs/geotiff.js/issues/61
        const ovrURL = this._url + '.ovr';
        return urlExists(ovrURL).then(ovrExists => {
          if (debug) console.log('overview exists:', ovrExists);
          if (ovrExists) {
            return fromUrls(this._url, [ovrURL], {cache: true, forceXHR: false});
          } else {
            return fromUrl(this._url, {cache: true, forceXHR: false});
          }
        });
      } else {
        // no pre-initialization steps required if not using a Cloud Optimized GeoTIFF
        return Promise.resolve();
      }
    }
  
    initialize(debug) {
      return this.preinitialize(debug).then(geotiff => {
        return new Promise((resolve, reject) => {
          if (debug) console.log('starting GeoRaster.initialize');
          if (debug) console.log('this', this);
  
          if (this.rasterType === 'object' || this.rasterType === 'geotiff' || this.rasterType === 'tiff') {
            if (this._web_worker_is_available) {
              const worker = new Worker('worker.js');
              worker.onmessage = (e) => {
                if (debug) console.log('main thread received message:', e);
                const data = e.data;
                for (const key in data) {
                  this[key] = data[key];
                }
                if (this._url) {
                  this._geotiff = geotiff;
                  this.getValues = function(options) {
                    return getValues(this._geotiff, options);
                  };
                }
                this.toCanvas = function(options) {
                  return toCanvas(this, options);
                };
                resolve(this);
              };
              if (debug) console.log('about to postMessage');
              if (this._data instanceof ArrayBuffer) {
                worker.postMessage({
                  data: this._data,
                  rasterType: this.rasterType,
                  sourceType: this.sourceType,
                  metadata: this._metadata,
                }, [this._data]);
              } else {
                worker.postMessage({
                  data: this._data,
                  rasterType: this.rasterType,
                  sourceType: this.sourceType,
                  metadata: this._metadata,
                });
              }
            } else {
              if (debug) console.log('web worker is not available');
              parseData({
                data: this._data,
                rasterType: this.rasterType,
                sourceType: this.sourceType,
                metadata: this._metadata,
              }, debug).then(result => {
                if (debug) console.log('result:', result);
                if (this._url) {
                  result._geotiff = geotiff;
                  result.getValues = function(options) {
                    return getValues(this._geotiff, options);
                  };
                }
                result.toCanvas = function(options) {
                  return toCanvas(this, options);
                };
                resolve(result);
              }).catch(reject);
            }
          } else {
            reject('couldn\'t find a way to parse');
          }
        });
      });
    }
};