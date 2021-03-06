/**
 * Resources Used
 * http://www.movable-type.co.uk/scripts/latlong.html?from=49.243824,-121.887340&to=49.235347,-121.92532
 * Used in calculating the distance between latitude and longitude
 */

"use strict";
const log = console.log;
require("dotenv").config();
const request = require("request");

const getLatLong = (address) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_GEOCODE_API_KEY}`;
  return new Promise((resolve, reject) => {
    request(
      {
        url: url,
        json: true,
      },
      (error, response, body) => {
        if (error) {
          reject("Can't connect to server");
        } else if (response.statusCode !== 200) {
          reject("Issue with getting resource");
        } else {
          resolve({
            lat: body.results[0].geometry.location.lat,
            long: body.results[0].geometry.location.lng,
          });
        }
      }
    );
  });
};

const getDistance = (fromLat, fromLong, toLat, toLong) => {
  const R = 6371e3; // metres
  const φ1 = (fromLat * Math.PI) / 180; // φ, λ in radians
  const φ2 = (toLat * Math.PI) / 180;
  const Δφ = ((toLat - fromLat) * Math.PI) / 180;
  const Δλ = ((toLong - fromLong) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = Math.round(((R * c) / 1000) * 100) / 100;
  return d;
};

module.exports = { getLatLong, getDistance };
