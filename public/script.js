/* -------------------------------------------
   Standort-Daten (werden aus der DB geladen)
-------------------------------------------- */
let LOCATIONS = [];

// Flag verhindert mehrfaches Absenden während eines laufenden Updates
let isUpdatingLocation = false;

/* -------------------------------------------
   Leaflet: Map & Marker Verwaltung
-------------------------------------------- */
let map = null;
let mapInitialized = false;

// Flag zur Markierung, ob aktuelles Bild entfernt werden soll
let removeImageFlag = false;

/* Marker je Location-ID (MongoDB _id oder id) */
const markersById = new Map();

/* -------------------------------------------
   Leaflet: Marker-Icons (normal / highlight)
-------------------------------------------- */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const highlightIcon = L.icon({
  /* Grüner Marker */
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [35, 55],        // größer
  iconAnchor: [17, 55],
  popupAnchor: [0, -100],
  shadowSize: [55, 55]
});

/* -------------------------------------------
   Screens aus dem DOM holen
-------------------------------------------- */
const screenLogin = document.querySelector("#screen-login");
const screenMain = document.querySelector("#screen-main");
const screenAdd = document.querySelector("#screen-add");
const screenDetails = document.querySelector("#screen-details");

/* -------------------------------------------
   Elemente im Main Screen
-------------------------------------------- */
const logoutBtn = document.querySelector(".re-logout");
const addBtn = document.querySelector("#btnAdd");
const rbUser = document.querySelector(".rb-user");

/* -------------------------------------------
   Elemente für Location-Liste & Details
-------------------------------------------- */
const detailTitleInput = document.querySelector("#detailTitle");
const detailDescriptionInput = document.querySelector("#detailDescription");
const detailStreetInput = document.querySelector("#detailStreet");
const detailZipCityInput = document.querySelector("#detailZipCity");
const detailCategorySelect = document.querySelector("#detailCategory");
const detailImage = document.querySelector("#detailImage");
const detailImageCaption = document.querySelector("#detailImageCaption");

const btnUpdate = document.querySelector("#btnUpdate");
const btnDelete = document.querySelector("#btnDelete");
const btnCloseDetails = document.querySelector("#closeDetails");

const detailLatInput = document.querySelector("#detailLat");  
const detailLonInput = document.querySelector("#detailLon");

// -------------------------------------------
// Bild-Upload: Dateiname anzeigen & Entfernen ermöglichen
// -------------------------------------------
const detailUploadInput = document.querySelector("#detailImageUpload");
const currentImageInfo = document.querySelector("#currentImageInfo");
const removeBtn = document.querySelector("#removeSelectedImage");

// Anzeige des Dateinamens bei Auswahl
if (detailUploadInput) {
  detailUploadInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      if (currentImageInfo) {
        currentImageInfo.textContent = this.files[0].name;
      }
      removeImageFlag = false;
    }
  });
}

// Entfernen-Button (X) für Bild
if (removeBtn) {
  removeBtn.addEventListener("click", function () {

    // File-Input zurücksetzen
    if (detailUploadInput) {
      detailUploadInput.value = "";
    }

    // Flag setzen, damit Backend das aktuelle Bild löscht
    removeImageFlag = true;

    // Dateiname-Anzeige leeren
    if (currentImageInfo) {
      currentImageInfo.textContent = "";
    }

    // Vorschau auf Default zurücksetzen
    if (detailImage) {
      detailImage.src = "images/kein_bild_vorhanden.png";
    }
  });
}




/* -------------------------------------------
   Add-Form & Location-Liste
-------------------------------------------- */
const addForm = document.querySelector("#addForm");
const addTitleInput = document.querySelector("#addTitle");
const addStreetInput = document.querySelector("#addStreet");
const addZipCityInput = document.querySelector("#addZipCity");
const addCategorySelect = document.querySelector("#addCategory");

const locationsList = document.querySelector("#locationsList");

/* aktuell ausgewählter Standort */
let currentLocationId = null;

/* -------------------------------------------
   Details eines Standorts anzeigen
-------------------------------------------- */
function openDetailsForLocation(locationId) {
  // Standort anhand von _id oder id finden
  const loc = LOCATIONS.find(l => String(l._id ?? l.id) === String(locationId));
  if (!loc) return;

  // Aktuell ausgewählten Standort merken
  currentLocationId = String(loc._id ?? loc.id);

  // Formular-Felder befüllen
  detailTitleInput.value = loc.title;
  detailDescriptionInput.value = loc.description || "";
  detailStreetInput.value = loc.street;
  detailZipCityInput.value = loc.zipCity;
  detailCategorySelect.value = loc.category || "";

  // Bild + Caption
  const uploadInput = document.querySelector("#detailImageUpload");

  // Default-Zustand zurücksetzen
  removeImageFlag = false;

  if (loc.photo === "images/kein_bild_vorhanden.png") {

    // Default-Bild anzeigen
    detailImage.src = "images/kein_bild_vorhanden.png";
    detailImage.alt = "Default image";

    // Kein Dateiname anzeigen
    if (currentImageInfo) {
      currentImageInfo.textContent = "";
    }

    // Delete-Button ausblenden (kein Bild vorhanden)
    if (removeBtn) {
      removeBtn.style.display = "none";
    }

  } else {

    // Echtes Bild anzeigen
    detailImage.src = loc.photo;
    detailImage.alt = loc.title;

    // Dateiname der gespeicherten Datei anzeigen
    if (currentImageInfo) {
      const fileName = loc.photo.split("/").pop();
      currentImageInfo.textContent = fileName;
    }

    // Delete-Button anzeigen
    if (removeBtn) {
      removeBtn.style.display = "inline-block";
    }
  }

  // File-Input immer leeren
  if (uploadInput) {
    uploadInput.value = "";
  }

  detailImageCaption.textContent = loc.caption || "";

  const fileInput = document.querySelector("#detailImageUpload");

if (loc.photo === "images/kein_bild_vorhanden.png") {

  // Kein gespeichertes Bild
  fileInput.removeAttribute("data-existing");

} else {

  // Gespeicherten Dateinamen im Input anzeigen
  const fileName = loc.photo.split("/").pop();
  fileInput.setAttribute("data-existing", fileName);

}

  // Latitude & Longitude anzeigen
  document.querySelector("#detailLat").value = loc.lat ?? "";
  document.querySelector("#detailLon").value = loc.lon ?? "";

  // Rollenabhängige Buttons
  updateDetailButtonsForRole();

  // Detail-Screen anzeigen
  showScreen(screenDetails);
}


/* -------------------------------------------
   Buttons im Detail-Screen je nach Rolle
-------------------------------------------- */
function updateDetailButtonsForRole() {
  if (!currentUser) {
    // Keine Benutzerinfo. Schreibrechte deaktivieren
    btnUpdate.style.display = "none";
    btnDelete.style.display = "none";
    btnCloseDetails.textContent = "Close";

    // Eingabefelder sperren
    detailTitleInput.readOnly = true;
    detailDescriptionInput.readOnly = true;
    detailStreetInput.readOnly = true;
    detailZipCityInput.readOnly = true;
    detailCategorySelect.disabled = true;
    document.querySelector("#detailImageUpload").disabled = true;

    return;
  }

  if (currentUser.role === "admin") {
    // Admin: Bearbeiten und Löschen erlaubt
    btnUpdate.style.display = "inline-flex";
    btnDelete.style.display = "inline-flex";
    btnCloseDetails.textContent = "Cancel";

    // Eingabefelder freigeben
    detailTitleInput.readOnly = false;
    detailDescriptionInput.readOnly = false;
    detailStreetInput.readOnly = false;
    detailZipCityInput.readOnly = false;
    detailCategorySelect.disabled = false;
    document.querySelector("#detailImageUpload").disabled = false;


    // Hinweis: Lat/Lon bleiben readOnly, da sie durch Re-Geocoding gesetzt werden
    // (keine manuelle Bearbeitung vorgesehen)
  } else {
    // Normalo: Nur Anzeige erlaubt
    btnUpdate.style.display = "none";
    btnDelete.style.display = "none";
    btnCloseDetails.textContent = "Close";

    // Eingabefelder sperren
    detailTitleInput.readOnly = true;
    detailDescriptionInput.readOnly = true;
    detailStreetInput.readOnly = true;
    detailZipCityInput.readOnly = true;
    detailCategorySelect.disabled = true;

    document.querySelector("#detailImageUpload").disabled = true;

    if (removeBtn) {
      removeBtn.style.display = "none";
    }

  }
}

/* -------------------------------------------
   Globale Variable für eingeloggte Person
-------------------------------------------- */
let currentUser = null;

/* -------------------------------------------
   Helferfunktion: alle Screens verstecken
-------------------------------------------- */
function hideAllScreens() {
  screenLogin.classList.add("hidden");
  screenMain.classList.add("hidden");
  screenAdd.classList.add("hidden");
  screenDetails.classList.add("hidden");
}

/* -------------------------------------------
   Screen anzeigen
-------------------------------------------- */
function showScreen(screen) {
  hideAllScreens();
  screen.classList.remove("hidden");
}

/* -------------------------------------------
   Leaflet: Karte initialisieren (OSM + Leaflet)
-------------------------------------------- */
function initMapIfNeeded() {
  if (mapInitialized) return;

  const mapEl = document.querySelector("#map");
  if (!mapEl) return; 

  // Karte auf Berlin zentrieren
  map = L.map("map").setView([52.52, 13.405], 12);

  // OpenStreetMap Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-Mitwirkende'
  }).addTo(map);

  mapInitialized = true;

  // Leaflet braucht manchmal ein Re-Layout, wenn Container vorher hidden war
  setTimeout(() => {
    try { map.invalidateSize(); } catch (_) {}
  }, 0);
}


/* -------------------------------------------
   Login-Formular abfangen
-------------------------------------------- */
document
  .querySelector("#screen-login form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    this.classList.add("validated");

    const username = this.querySelector("input[type='text']").value.trim();
    const password = this.querySelector("input[type='password']").value.trim();

    try {
      const response = await fetch("/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        alert("Invalid username or password!");
        return;
      }

      const user = await response.json();
      currentUser = user;

      // Name anzeigen
      rbUser.textContent = user.name;

      // Admin-Button
      if (user.role === "admin") {
        addBtn.style.display = "inline-flex";
      } else {
        addBtn.style.display = "none";
      }

      updateDetailButtonsForRole();

      await loadLocationsFromDB();
      showScreen(screenMain);

      // Leaflet: Karte erst initialisieren, wenn Main-Screen sichtbar ist
      initMapIfNeeded();
      refreshMapMarkers();

    } catch (err) {
      console.error(err);
      alert("Server not available!");
    }
  });


/* -------------------------------------------
   Adresse -> Geo-Koordinaten (über Server-Proxy)
-------------------------------------------- */
async function geocodeAddress(street, zipCity) {

  const url = `/geocode?street=${encodeURIComponent(street)}&zipCity=${encodeURIComponent(zipCity)}`;

  const response = await fetch(url, {
    headers: { "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error("Geo web service unavailable");
  }

  return await response.json(); // entweder {lat, lon} oder null
}


/* -------------------------------------------
   Leaflet: Marker anhand LOCATIONS aktualisieren
-------------------------------------------- */
function refreshMapMarkers() {
  if (!mapInitialized || !map) return;

  // Marker löschen, damit wir sauber neu zeichnen
  for (const marker of markersById.values()) {
    marker.remove();
  }
  markersById.clear();

  // Neue Marker anlegen
  LOCATIONS.forEach((loc) => {
    const id = String(loc._id ?? loc.id);

    const lat = typeof loc.lat === "number" ? loc.lat : parseFloat(loc.lat);
    const lon = typeof loc.lon === "number" ? loc.lon : parseFloat(loc.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const marker = L.marker([lat, lon], { icon: defaultIcon }).addTo(map);

    /* Tooltip: Name der Location beim Hover anzeigen */
    marker.bindTooltip(`${loc.title ?? "Location"}`, {
      direction: "top",
      offset: [0, -50],
      opacity: 0.95,
      sticky: true
    });

    marker.bindPopup(`<b>${loc.title ?? "Location"}</b>`);

    // Optional: Klick auf Marker öffnet Details wie Klick in Liste
    marker.on("click", () => openDetailsForLocation(id));

    markersById.set(id, marker);
  });
}


/* -------------------------------------------
   Standorte aus der Datenbank laden (GET /loc)
-------------------------------------------- */
async function loadLocationsFromDB() {
  try {
    // Standorte vom Backend abrufen
    const response = await fetch("/loc");

    if (!response.ok) {
      alert("Error loading locations from the database.");
      return;
    }

    const data = await response.json();

    // Daten in globale Locations-Struktur übernehmen
    LOCATIONS = data;

    // Liste im DOM neu aufbauen
    locationsList.innerHTML = "";
    LOCATIONS.forEach(loc => addLocationToList(loc));

    // Leaflet: Marker aktualisieren (falls die Karte schon initialisiert wurde)
    refreshMapMarkers();


  } catch (err) {
    console.error(err);
    alert("Backend unavailable or error loading locations.");
  }
}

/* -------------------------------------------
   Leaflet: Marker highlighten bei Hover
-------------------------------------------- */
function highlightMarker(id) {
  const marker = markersById.get(String(id));
  if (!marker) return;

  // Marker größer + grün
  marker.setIcon(highlightIcon);

  // Tooltip anzeigen
  marker.openTooltip();

  // Marker nach vorne holen
  marker.setZIndexOffset(1000);

  if (map) {
    const latLng = marker.getLatLng();
    const bounds = map.getBounds();

    if (!bounds.contains(latLng)) {
      map.panTo(latLng, { animate: true, duration: 0.4 });
    }
  }  
}

/* -------------------------------------------
   Leaflet: Hover-Highlight zurücksetzen
-------------------------------------------- */
function unhighlightMarker(id) {
  const marker = markersById.get(String(id));
  if (!marker) return;

  // Zurück zum Standard-Marker
  marker.setIcon(defaultIcon);

  // Tooltip schließen
  marker.closeTooltip();

  marker.setZIndexOffset(0);
}



/* -------------------------------------------
   Standort dynamisch zur Liste hinzufügen
-------------------------------------------- */
function addLocationToList(loc) {
  const article = document.createElement("article");
  article.classList.add("place");

  // MongoDB _id verwenden (fallback auf id)
  const locId = loc._id ?? loc.id;

  article.innerHTML = `
    <div class="place-media">
      <img src="${loc.photo}" alt="${loc.title}" />
    </div>
    <div class="place-content">
      <h4 class="place-title">${loc.title}</h4>
      <p class="place-address">${loc.street}, ${loc.zipCity}</p>
      <p class="place-note">${loc.caption || loc.category}</p>
    </div>
  `;
  //ID der Location speichern (für Map-Verknüpfung)
  const id = String(loc._id ?? loc.id);
  article.dataset.id = id;
  //Hover-Effekt: Beim Überfahren mit der Maus -> Marker hervorheben
  article.addEventListener("mouseenter", () => {
    highlightMarker(id);
  });
  //Hover-Ende: Wenn Maus das Element verlässt -> Marker zurücksetzen
  article.addEventListener("mouseleave", () => {
    unhighlightMarker(id);
  });

  // Klick auf Standortstitel öffnet Detail-Screen
  article.querySelector(".place-title").addEventListener("click", (e) => {
    e.stopPropagation();
    openDetailsForLocation(String(locId));
  });

  locationsList.appendChild(article);
}

/* -------------------------------------------
   Logout-Funktion
-------------------------------------------- */
logoutBtn.addEventListener("click", function () {
  currentUser = null;

  // Login-Felder leeren
  const loginForm = document.querySelector("#screen-login form");
  loginForm.reset();
  
  showScreen(screenLogin);
});

/* -------------------------------------------
   Navigation: Add Screen öffnen
-------------------------------------------- */
addBtn.addEventListener("click", function () {
  showScreen(screenAdd);
});

/* -------------------------------------------
   Add Screen: Cancel zurück zum Main Screen
-------------------------------------------- */
document.querySelector("#cancelAdd").addEventListener("click", function () {
  showScreen(screenMain);
});

/* -------------------------------------------
   Add-Form: neuen Standort anlegen (nur admina)
-------------------------------------------- */
addForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Validierungs-Styling aktivieren
  addForm.classList.add("validated");

  // HTML5-Validation: wenn etwas fehlt, abbrechen
  if (!addForm.checkValidity()) {
    return;
  }

  // Nur Admin darf anlegen
  if (!currentUser || currentUser.role !== "admin") {
    alert("Only the administrator can create new locations.");
    return;
  }

  const title = addTitleInput.value.trim();
  const description = document.querySelector("#addDescription").value.trim();
  const street = addStreetInput.value.trim();
  const zipCity = addZipCityInput.value.trim();
  const category = addCategorySelect.value;

  /* ----------------------------------------------------------
    Bild verarbeiten (falls der Benutzer eines hochlädt)
  ----------------------------------------------------------- */


  try {
    // Geo-Koordinaten holen
    const coords = await geocodeAddress(street, zipCity);

    if (!coords) {
      alert("No geographic coordinates could be found for this address. Please check the address.");
      return;
    }

    // Payload für Backend (WICHTIG: keine id / _id mitschicken)
    const payload = {
      title,
      description,
      street,
      zipCity,
      category,
      caption: category,
      lat: coords.lat,
      lon: coords.lon
    };

    /* ----------------------------------------------------------------
      Erstellung eines neuen Standorts mittels multipart/form-data
      Bilddatei wird optional als "image" übertragen
    ----------------------------------------------------------------- */
    const formData = new FormData();

    // Standortdaten anhängen
    formData.append("title", title);
    formData.append("description", description);
    formData.append("street", street);
    formData.append("zipCity", zipCity);
    formData.append("category", category);
    formData.append("caption", category);
    formData.append("lat", coords.lat);
    formData.append("lon", coords.lon);

    // Optionales Bild anhängen (wird im Backend via multer verarbeitet)
    const fileInput = document.querySelector("#addImage");
    if (fileInput.files && fileInput.files[0]) {
      formData.append("image", fileInput.files[0]);
    }

    // POST-Request ohne Content-Type Header,
    // da der Browser multipart/form-data automatisch setzt
    const response = await fetch("/loc", {
      method: "POST",
      body: formData
    });


    console.log("POST /loc status:", response.status);
    console.log("POST /loc location header:", response.headers.get("Location"));
    const txt = await response.text();
    console.log("POST /loc response body:", txt);


    if (response.status !== 201) {
    alert("Fehler beim Anlegen des Standorts. Status: " + response.status);
    return;
    }
    // Liste neu aus DB laden
    await loadLocationsFromDB();

    // Formular zurücksetzen
    addForm.reset();
    addForm.classList.remove("validated");

    // Zurück zum Main-Screen
    showScreen(screenMain);

  } catch (err) {
    console.error(err);
    alert("An error occurred while creating the location. Please try again later.");
  }
});


/* -------------------------------------------
   Details Screen schließen (Close/Cancel)
-------------------------------------------- */
btnCloseDetails.addEventListener("click", function () {
  showScreen(screenMain);
});
/* -------------------------------------------
   ESC-Taste schließt Details Screen
-------------------------------------------- */
document.addEventListener("keydown", function (e) {

  if (e.key === "Escape") {

    // Wenn Details Screen sichtbar ist -> zurück zum Main Screen
    if (!screenDetails.classList.contains("hidden")) {
      showScreen(screenMain);
    }

  }

});

/* -------------------------------------------
   Update-Handler für das Bearbeiten von Standorten
-------------------------------------------- */
btnUpdate.addEventListener("click", async function () {

  // Verhindert mehrfaches Klicken während laufendem Update
  if (isUpdatingLocation) return;
  isUpdatingLocation = true;

  // Update-Button temporär deaktivieren
  btnUpdate.disabled = true;

  try {

    // Standort aus Datenstruktur holen
    const loc = LOCATIONS.find(l => String(l._id ?? l.id) === String(currentLocationId));
    if (!loc) {
      isUpdatingLocation = false;
      btnUpdate.disabled = false;
      return;
    }

    // Eingaben auslesen
    const newTitle = detailTitleInput.value.trim();
    const newStreet = detailStreetInput.value.trim();
    const newZipCity = detailZipCityInput.value.trim();
    const newCategory = detailCategorySelect.value;

    // Validierung der Pflichtfelder
    if (!newTitle || !newStreet || !newZipCity) {
      alert("Please fill in all required fields!");
      return;
    }

    

    // Adresse vergleichen – nur bei Änderungen geocoden
    const oldFullAddress = (loc.street ?? "") + ", " + (loc.zipCity ?? "");
    const newFullAddress = newStreet + ", " + newZipCity;

    let newLat = loc.lat;
    let newLon = loc.lon;

    if (oldFullAddress !== newFullAddress) {

      // Geocoding nur wenn Adresse wirklich geändert wurde
      const coords = await geocodeAddress(newStreet, newZipCity);

      if (!coords) {
      alert("No geographic coordinates could be found for the new address. The old address remains unchanged.");

      
      detailStreetInput.value = loc.street;
      detailZipCityInput.value = loc.zipCity;

      return;
    }

      newLat = coords.lat;
      newLon = coords.lon;
    }

    // Payload für PUT (WICHTIG: keine id/_id schicken)
    const payload = {
      title: newTitle,
      description: detailDescriptionInput.value.trim(),
      street: newStreet,
      zipCity: newZipCity,
      category: newCategory,
      caption: newCategory,
      lat: newLat,
      lon: newLon
    };

    /* ---------------------------------------------
      Aktualisierung eines bestehenden Standorts
      Unterstützt optionalen Bildaustausch 
    ---------------------------------------------- */
    const formData = new FormData();

    // Aktualisierte Standortdaten anhängen
    formData.append("title", newTitle);
    formData.append("description", detailDescriptionInput.value.trim());
    formData.append("street", newStreet);
    formData.append("zipCity", newZipCity);
    formData.append("category", newCategory);
    formData.append("caption", newCategory);
    formData.append("lat", newLat);
    formData.append("lon", newLon);

    // Falls ein neues Bild ausgewählt wurde,
    // wird dieses die bestehende Datei im Backend ersetzen
    const fileInput = document.querySelector("#detailImageUpload");
    if (fileInput.files && fileInput.files[0]) {
      formData.append("image", fileInput.files[0]);
    }

    // Wenn Bild über X-Button entfernt wurde,
    // wird ein entsprechendes Lösch-Flag an das Backend gesendet
    if (removeImageFlag) {
      formData.append("removeImage", "true");
    }

    // PUT-Request als multipart/form-data
    const response = await fetch(`/loc/${currentLocationId}`, {
      method: "PUT",
      body: formData
    });


    if (response.status === 204) {
      await loadLocationsFromDB();
      showScreen(screenMain);
      alert("Location successfully updated!");

      // Entfernen-Flag nach erfolgreichem Update zurücksetzen
      removeImageFlag = false;

      return;
    }

    if (response.status === 404) {
      alert("Location not found (404). Please reload the list!");
      await loadLocationsFromDB();
      showScreen(screenMain);
      return;
    }

    const txt = await response.text();
    alert("Error during update. Status: " + response.status + " | " + txt);

  } catch (err) {
    console.error(err);
    alert("Backend unavailable or error during update. Try again later!");
  }

  finally {
    // Update wieder freigeben
    isUpdatingLocation = false;
    btnUpdate.disabled = false;
  }

});




/* -------------------------------------------
   Delete-Handler für das Löschen von Standorten
-------------------------------------------- */
btnDelete.addEventListener("click", async function () {

  if (!confirm("Are you sure you want to delete this location?")) {
    return;
  }

  try {
    const response = await fetch(`/loc/${currentLocationId}`, {
      method: "DELETE"
    });

    if (response.status === 204) {
      await loadLocationsFromDB();
      showScreen(screenMain);
      alert("Location deleted!");
      return;
    }

    if (response.status === 404) {
      alert("Location not found (404). Please reload the list!");
      await loadLocationsFromDB();
      showScreen(screenMain);
      return;
    }

    const txt = await response.text();
    alert("Error while deleting. Status: " + response.status + " | " + txt);

  } catch (err) {
    console.error(err);
    alert("Backend unavailable or error during deletion. Try again later!");
  }
});
