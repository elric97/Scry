let app = require('express')();

let CronJob = require('cron').CronJob;
let sm = require('sitemap');
let robots = require('express-robots');

let dataDictionary = require('../utilities/dataDictionary.js');

const changeFrequency = {
  'default': 'always',

  'static': 'monthly',
  'home': 'daily',
  'video': 'weekly',

  'always': 'always',
  'monthly': 'monthly',
  'daily': 'daily',
  'weekly': 'weekly'
};
const priority = {
  'default': 0.6,
  'junk': 0.1,
  'webpage': 0.2,
  'business': 0.3,
  'home': 0.7,
  'video': 0.8
};
const staticPages = [
  {
    'url': '/',
    'changefreq': changeFrequency['home'],
    'priority': priority['home'],
    'lastmodrealtime': true
  },
  {
    'url': '/utility/page',   // examples
    'hide': true              //
  },
  {
    'url': '/post-function',  //
    'httpreq': 'post'         //
  }
];

// Helper Functions
const updateSitemap = () => {};
const generateStaticUrlArray = () => {
  const urlArray = [];
  staticPages.forEach((page) => {
    if (page['hide'] !== undefined || page['httpreq'] === 'post') {
      // Do not include this page
    } else {
      urlArray.push({
        "url": page.url,
        "changefreq": page.changefreq,
        "priority": page.priority,
        "lastmodrealtime": true
      });
    }
  });
  dataDictionary.getVideosList().forEach((video) => {
    let videoName = dataDictionary.formatTitleForUrl(video);
    urlArray.push({
      "url": '/episode/' + videoName,
      "changefreq": changeFrequency['video'],
      "priority": priority['video'],
      "lastmodrealtime": true
    });
  });
  return urlArray;
};

sitemap = sm.createSitemap({
  hostname: 'https://www.example.com/',
  //cacheTime: 86400,                 // 1 day cache period
  urls: generateStaticUrlArray()
});
let sitemapRegeneration = new CronJob({
  cronTime: '00 30 04 * * *',         // Runs everyday at 04:30
  onTick: updateSitemap,              // Execute updateSitemap() at cronTime
  //runOnInit: true,                  // Fire immediately
  start: false,                       // Start script, to fire at cronTime
  timeZone: 'America/Los_Angeles'     // ...?
});

// Robot.txt Configuration ~~~~~~
const disallowedUrls = staticPages
  .filter((page) => {
    return (page['hide'] !== undefined && page['url'].indexOf(':') == -1);
  })
  .map((page) => {
    return page['url'];
  });

let robotConfig = {
  UserAgent: '*',
  Disallow: disallowedUrls
};

// Meta Robots Configuration ~~~~~~
// To be developed.

app.use(robots(robotConfig));
app.get('/sitemap.xml', function (req, res) {
  res.header('Content-Type', 'application/xml');
  res.send(sitemap.toString());
});

module.exports = app;