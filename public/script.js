

/* -------------------------------------------
   Standort-Daten (werden aus der DB geladen)
-------------------------------------------- */
let LOCATIONS = [];


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


/* -------------------------------------------
   Add-Form & Location-Liste
-------------------------------------------- */
const addForm = document.querySelector("#addForm");
const addTitleInput = document.querySelector("#addTitle");
const addStreetInput = document.querySelector("#addStreet");
const addZipCityInput = document.querySelector("#addZipCity");
const addCategorySelect = document.querySelector("#addCategory");

const locationsList = document.querySelector("#locationsList");

/* ----------------------------------------------------------
   Hilfsfunktion zum Lesen eines Bildes 
----------------------------------------------------------- */
function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);   // Bild wird in Base64 umgewandelt
  });
}

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
  detailImage.src = loc.photo;
  detailImage.alt = loc.title;
  detailImageCaption.textContent = loc.caption || "";

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
        alert("Ungültiger Benutzername oder Passwort!");
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

    } catch (err) {
      console.error(err);
      alert("Server nicht erreichbar");
    }
  });


/* -------------------------------------------
   Geo-Webservice: Adresse -> lat/lon
   (Beispiel mit Nominatim / OpenStreetMap)
-------------------------------------------- */
async function geocodeAddress(street, zipCity) {
  const query = encodeURIComponent(`${street}, ${zipCity}, Berlin, Germany`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;


  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "ReLeafBerlin/1.0 (example@example.com)"
    }
  });

  if (!response.ok) {
    throw new Error("Geo-Webservice nicht erreichbar");
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    // Keine Treffer
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

/* -------------------------------------------
   Standorte aus der Datenbank laden (GET /loc)
-------------------------------------------- */
async function loadLocationsFromDB() {
  try {
    // Standorte vom Backend abrufen
    const response = await fetch("/loc");

    if (!response.ok) {
      alert("Fehler beim Laden der Standorte aus der DB.");
      return;
    }

    const data = await response.json();

    // Daten in globale Locations-Struktur übernehmen
    LOCATIONS = data;

    // Liste im DOM neu aufbauen
    locationsList.innerHTML = "";
    LOCATIONS.forEach(loc => addLocationToList(loc));

  } catch (err) {
    console.error(err);
    alert("Backend nicht erreichbar oder Fehler beim Laden der Standorte.");
  }
}

/* -------------------------------------------
   Standort dynamisch zur Liste hinzufügen
-------------------------------------------- */
function addLocationToList(loc) {
  const article = document.createElement("article");
  article.classList.add("place");

  // MongoDB _id verwenden (fallback auf id)
  const locId = loc._id ?? loc.id;
  article.setAttribute("data-id", String(locId));

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
    alert("Nur Admin kann neue Standorte anlegen.");
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
  const fileInput = document.querySelector("#addImage");
  let imageData = "images/kein_bild_vorhanden.png";  // Standardbild

  if (fileInput.files && fileInput.files[0]) {
    imageData = await readImageAsBase64(fileInput.files[0]);
  }

  try {
    // Geo-Koordinaten holen
    const coords = await geocodeAddress(street, zipCity);

    if (!coords) {
      alert("Für diese Adresse konnten keine Geo-Koordinaten gefunden werden. Bitte Adresse prüfen.");
      return;
    }

    // Payload für Backend (WICHTIG: keine id / _id mitschicken)
    const payload = {
      title,
      description,
      street,
      zipCity,
      category,
      photo: imageData,
      caption: category,
      lat: coords.lat,
      lon: coords.lon
    };

    // Standort in DB anlegen
    const response = await fetch("/loc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
    alert("Es ist ein Fehler beim Anlegen des Standorts aufgetreten. Bitte später erneut versuchen.");
  }
});


/* -------------------------------------------
   Details Screen schließen (Close/Cancel)
-------------------------------------------- */
btnCloseDetails.addEventListener("click", function () {
  showScreen(screenMain);
});

/* -------------------------------------------
   Update-Handler für das Bearbeiten von Standorten
-------------------------------------------- */
btnUpdate.addEventListener("click", async function () {

  // Standort aus Datenstruktur holen
  const loc = LOCATIONS.find(l => String(l._id ?? l.id) === String(currentLocationId));
  if (!loc) return;

  // Eingaben auslesen
  const newTitle = detailTitleInput.value.trim();
  const newStreet = detailStreetInput.value.trim();
  const newZipCity = detailZipCityInput.value.trim();
  const newCategory = detailCategorySelect.value;

  // Validierung der Pflichtfelder
  if (!newTitle || !newStreet || !newZipCity) {
    alert("Bitte alle Pflichtfelder ausfüllen.");
    return;
  }

  // Bild vorbereiten (falls neu hochgeladen)
  let newPhoto = loc.photo;
  const fileInput = document.querySelector("#detailImageUpload");
  if (fileInput.files && fileInput.files[0]) {
    newPhoto = await readImageAsBase64(fileInput.files[0]);
  }

  // Adresse vergleichen – nur bei Änderungen geocoden
  const oldFullAddress = (loc.street ?? "") + ", " + (loc.zipCity ?? "");
  const newFullAddress = newStreet + ", " + newZipCity;

  let newLat = loc.lat;
  let newLon = loc.lon;

  if (oldFullAddress !== newFullAddress) {
    const coords = await geocodeAddress(newStreet, newZipCity);
    if (!coords) {
      alert("Für die neue Adresse konnten keine Geo-Koordinaten gefunden werden.");
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
    photo: newPhoto,
    caption: newCategory,
    lat: newLat,
    lon: newLon
  };

  try {
    const response = await fetch(`/loc/${currentLocationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 204) {
      await loadLocationsFromDB();
      showScreen(screenMain);
      alert("Standort erfolgreich aktualisiert.");
      return;
    }

    if (response.status === 404) {
      alert("Standort nicht gefunden (404). Bitte Liste neu laden.");
      await loadLocationsFromDB();
      showScreen(screenMain);
      return;
    }

    const txt = await response.text();
    alert("Fehler beim Update. Status: " + response.status + " | " + txt);

  } catch (err) {
    console.error(err);
    alert("Backend nicht erreichbar oder Fehler beim Update.");
  }
});



/* -------------------------------------------
   Delete-Handler für das Löschen von Standorten
-------------------------------------------- */
btnDelete.addEventListener("click", async function () {

  if (!confirm("Möchten Sie diesen Standort wirklich löschen?")) {
    return;
  }

  try {
    const response = await fetch(`/loc/${currentLocationId}`, {
      method: "DELETE"
    });

    if (response.status === 204) {
      await loadLocationsFromDB();
      showScreen(screenMain);
      alert("Standort wurde gelöscht.");
      return;
    }

    if (response.status === 404) {
      alert("Standort nicht gefunden (404). Bitte Liste neu laden.");
      await loadLocationsFromDB();
      showScreen(screenMain);
      return;
    }

    const txt = await response.text();
    alert("Fehler beim Löschen. Status: " + response.status + " | " + txt);

  } catch (err) {
    console.error(err);
    alert("Backend nicht erreichbar oder Fehler beim Löschen.");
  }
});
