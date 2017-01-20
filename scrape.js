console.log('Starting Parks Victoria GPS scraper.');

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var q = require('q');
var qlimit = require('qlimit');
var fetch = require('node-fetch');

var Park = require('./src/Park');

const PARKS_LIST_BASE_URL = 'http://webmap.hphp.geomatic.com.au/MarsHandler.veplus?directory=V_PARKS_SEARCH&cmd=parksearchadvanced&searchOrder=Name&query=pr-keyword%3D%26pr-distance%3D%26pr-location%3D&ajaxDataType=jsonp&pageSize=100&pageNo={page}';

var getParks = function(_parksPage, _currentParks) {
  let parksPage = _parksPage || 1;
  let currentParks = _currentParks || [];

  return fetchParksList(parksPage).then(parks => {
    // Keep scraping until there are no more results.
    if (parks.length == 0) {
      console.log(`Parks metadata download complete: ${currentParks.length} downloaded!`);

      return currentParks;
    }

    currentParks = currentParks.concat(parks);
    process.stdout.write(`Downloading Parks metadata: ${currentParks.length} downloaded...` + "\r");
    
    return getParks(parksPage + 1, currentParks);
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

getParks().then(parks => {
  var limit = qlimit(2);
  var parksPromises = parks.map(limit(park => park.fetchLandmarks()));
  
  q.all(parksPromises).then(landmarks => {
    fs.writeFile('output.json', JSON.stringify(parks, null, 4), function(err){
      console.log('Parks data successfully written to ./output.json');
    });
  });
});
