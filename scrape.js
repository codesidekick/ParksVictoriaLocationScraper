console.log('Starting Parks Victoria GPS scraper...');

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var q = require('q');
var fetch = require('node-fetch');

const PARKS_LIST_BASE_URL = 'http://webmap.hphp.geomatic.com.au/MarsHandler.veplus?directory=V_PARKS_SEARCH&cmd=parksearchadvanced&query=pr-keyword%3D%26pr-distance%3D%26pr-location%3D&ajaxDataType=jsonp&pageSize=50&pageNo={page}';
const PARK_LANDMARKS_URL = 'http://webmap.hphp.geomatic.com.au/MarsHandler.veplus?directory=PV_MAP_SPATIAL_ENTITY&cmd=getitemsbyid&searchtype=ParkLanding&pageSize=10&query={guid}';

var getParks = function(_parksPage, _currentParks) {
  let parksPage = _parksPage || 1;
  let currentParks = _currentParks || [];

  return fetchParksList(parksPage).then(parks => {
    if (parks.length == 0 || _parksPage > 5) {
      console.log(`Parks metadata download complete: ${currentParks.length + 1} downloaded`);

      return currentParks;
    }
    else {
      currentParks = currentParks.concat(parks);
      console.log(`Downloading Parks metadata: ${currentParks.length + 1} downloaded`);
      
      return getParks(parksPage + 1, currentParks);
    }
  })
};

var fetchParksList = function(pageNumber) {
  return fetch(PARKS_LIST_BASE_URL.replace('{page}', pageNumber)).then(data => {
    return data.text();
  }).then(data => {
    const parks = [];
    const parsedData = JSON.parse(data.slice(1, -1));
    const results = parsedData.response;
    
    results.forEach(rawResult => {
      try {
        let jsonResult = JSON.parse(rawResult);
        let {title, description, guid} = jsonResult;
        
        parks.push(new Park(title, description, guid));
      }
      catch(e) {
      }
    });
    
    return parks;
  });
}

var scrapePark = function (parkUrl) {
  return [
    { title: 'test', url: parkUrl }
  ]
}

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

      landmarkResults.forEach((landmarkResult) => {
        // Deal with double encoded strings.
        let landmarkJson = JSON.parse(landmarkResult);
        var landmark = this.processLandmarkResult(landmarkJson);
        
        this.addLandmark(landmark);
      });
      
    }).then(() => this.landmarks);
  }
  processLandmarkResult(landmarkResult) {
    let {title, description, mapLatLng} = landmarkResult;
    let coordinates = new Coordinate(mapLatLng.lat, mapLatLng.lng);

    return new ParkLandmark(title, description, coordinates)
  }
}

class ParkLandmark {
  constructor(title, description, coordinates) {
    this.title = title;
    this.description = description;
    this.coordinates = coordinates;
  }
};

class Coordinate {
  constructor(lat, long) {
    this.lat = lat;
    this.long = long;
  }
}

var fetchPark = function(parkUrl) {
  return fetch(parkUrl).then(function(res) {
    return res.text();
  }).then(function(html) {
    let $ = cheerio.load(html);
    
    let title = $('meta[name="DC.Title"]').attr('content');
    let guid = $('#guid').text();
    
    let landmarksUrl = PARK_LANDMARKS_URL.replace('{guid}', guid);
    
    return new Park(title, guid);
  });
}

var scrapeParks = function (parkUrls) {
  const parkPromises = [];
  const deferred = q.defer();

  parkUrls.forEach(parkUrl => {
    parkPromises = fetchPark(parkUrl);
  });
  
  return q.all(deffered.promise);
}

getParks().then(parks => {
  console.log(parks.length);
});
