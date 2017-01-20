## Synopsis

This simple NodeJS scraper outputs a list of all Victorian national parks complete with their points of interest and exact GPS coordinates for use in your favourite nav tool.

## Demo

Visit https://codesidekick.github.io/ParksVictoriaLocationScraper/ to see a current full list of national parks locations with links to Google Maps.

## Installation

1. Install using `npm install`
2. Run using `node scrape.js`
3. Open the `output.json` to see the scraped data

## Motivation

Currently on [Parks Victoria](http://parkweb.vic.gov.au) it's impossible to get GPS coordinates for the national parks and camping areas. This makes it difficult to get directions using Google Maps as often Google Maps doesn't find campsites or doesn't place them correctly on the map.

## Troubleshooting

You may need to remove the `output.json` file in the root directory in order for fs to successfully write the file.