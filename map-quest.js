"use strict";
const log = console.log;
require("dotenv").config();
const request = require("request");

const getLatLong = (address) => {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://www.mapquestapi.com/geocoding/v1/address?key=${process.env.MAP_QUEST_API_KEY}&location=${address}`,
        json: true,
      },
      (error, response, body) => {
        if (error) {
          reject("Can't connect to server");
        } else if (response.statusCode !== 200) {
          reject("Issue with getting resource");
        } else {
          const result = body.results[0].locations[0].latLng;
          log(result);
          resolve({
            lat: result.lat,
            long: result.lng,
          });
        }
      }
    );
  });
};

module.exports = { getLatLong };