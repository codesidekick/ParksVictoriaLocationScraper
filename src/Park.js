var fetch = require('node-fetch');
var ParkLandmark = require('./ParkLandmark');
var Coordinate = require('./Coordinate');

const PARK_LANDMARKS_URL = 'http://webmap.hphp.geomatic.com.au/MarsHandler.veplus?directory=PV_MAP_SPATIAL_ENTITY&cmd=getitemsbyid&searchtype=ParkLanding&pageSize=10&query={guid}';

class Park {
  constructor(title, description, guid) {
    this.title = title;
    this.description = description;
    this.guid = guid;
    this.landmarks = [];
  }
  addLandmark(landmark) {
    this.landmarks.push(landmark);
  }
  fetchLandmarks() {
    let landmarksUrl = PARK_LANDMARKS_URL.replace('{guid}', this.guid);
    
    return fetch(landmarksUrl).then(json => {
      return json.text();
    }).then(landmarkResponseText => {
      var json = JSON.parse(landmarkResponseText.slice(1, -1));
      var landmarkResults = json.response;

      landmarkResults.forEach(landmarkResult => {
        try {
        // Deal with double encoded strings.
        let landmarkJson = JSON.parse(landmarkResult);
        var landmark = this.processLandmarkResult(landmarkJson);
        
        this.addLandmark(landmark);
        }
        catch(e) {
          console.log(`Landmark for ${this.title} failed to load`);
        }
      });
        
      console.log(`Fetched ${this.landmarks.length} landmark(s) for ${this.title}`);
      
    }).then(() => this.landmarks);
  }
  processLandmarkResult(landmarkResult) {
    let {title, mapLatLng} = landmarkResult;
    let coordinates = new Coordinate(mapLatLng.lat, mapLatLng.lng);

    return new ParkLandmark(title, coordinates)
  }
};

module.exports = Park;
