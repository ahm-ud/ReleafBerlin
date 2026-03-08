
import { createServer } from 'http';
import express, { json, static as expressStatic} from 'express';
import { join } from 'path';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import.meta.dirname;
import locRouter from './routes/loc.js';

let app = express();

// json() - Returns middleware that only parses json 
// and only looks at requests where the Content-Type 
// header matches the type option.
// JSON Payload kann wegen Base64-Bildern größer sein 
// Erhöht das JSON-Limit, da Bilder als Base64 im Request übertragen werden können.   
app.use(json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

/*
 * Setting up the routes
 */

// 1) http://localhost:8000/ shall fetch the index.html 
// ../public is the directory for the static ressources
// GET http://localhost:8000/ or GET http://localhost:8000/index.html 
// returns the index.html in /public
app.use(expressStatic(join(import.meta.dirname, '../public')));
app.use('/login', indexRouter);

// 2) http://localhost:8000/users
app.use('/users', usersRouter);
// http://localhost:8000/loc
app.use('/loc', locRouter);


/* -------------------------------------------
   Geocoding Proxy (Server-Side) für Nominatim
-------------------------------------------- */
const geoCache = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/geocode", async function (req, res) {

  const street = String(req.query.street ?? "").trim();
  const zipCity = String(req.query.zipCity ?? "").trim();

  if (!street || !zipCity) {
    return res.status(400).json({ error: "Missing street/zipCity" });
  }

  const cacheKey = `${street}|${zipCity}`.toLowerCase();

  // Cache nutzen, um Rate-Limits zu vermeiden
  if (geoCache.has(cacheKey)) {
    return res.status(200).json(geoCache.get(cacheKey));
  }

  const query = encodeURIComponent(`${street}, ${zipCity}, Berlin, Germany`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`;

  // Mehrere Versuche, falls Nominatim kurzzeitig blockt (z.B. 425/429)
  const maxTries = 3;

  for (let attempt = 1; attempt <= maxTries; attempt++) {

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          // WICHTIG: Auf dem Server kann man einen echten User-Agent setzen
          "User-Agent": "ReLeafBerlin/1.0 (contact: ahmed@student.htw-berlin.de)"
        }
      });

      // Bei Rate-Limit / Too Early / Busy -> warten und nochmal
      if ([425, 429, 503].includes(response.status)) {
        await sleep(800 * attempt);
        continue;
      }

      if (!response.ok) {
        return res.status(502).json({ error: `Nominatim error: ${response.status}` });
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return res.status(200).json(null);
      }

      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };

      // Cache speichern
      geoCache.set(cacheKey, coords);

      return res.status(200).json(coords);

    } catch (e) {
      // Network/Fetch Fehler -> kurz warten und retry
      await sleep(800 * attempt);
    }
  }

  return res.status(504).json({ error: "Geocoding service temporarily unavailable" });
});

// 3) Send "Not found" for all other 'paths'
app.use(function(req, res) {
  res.status(404).send('Not found: ' + req.path);
});

// 4) Error handler
app.use(function(err, res) {
  // send the error page
  res.status(err.status || 500).send('error' + err.message);
});


const port = 8000;
app.set('port', port);

/*
 * Create HTTP server.
 */
let server = createServer(app);

/*
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/*
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/*
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
