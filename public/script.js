/* -------------------------------------------
   Benutzer-Daten (statisch laut Beleg 3)
-------------------------------------------- */
const USERS = [
  { username: "admina", password: "password", role: "admin", name: "Mina" },
  { username: "normalo", password: "password", role: "non-admin", name: "Norman" }
];

/* -------------------------------------------
   Standort-Daten (statisch)
-------------------------------------------- */
const LOCATIONS = [
  {
    id: 0,
    title: "BVG U-Bahn Betriebswerkstatt Friedrichsfelde",
    description: "BVG U-Bahn Betriebswerkstatt Friedrichsfelde",
    street: "Zachertstraße 84",
    zipCity: "10315 Berlin",
    category: "ÖPNV",
    photo: "images/bvg-friedrichsfelde.jpg",
    caption: "ÖPNV • Werkstatt der Berliner Verkehrsbetriebe",
     lat: "52.505069",
    lon: "13.5120618"
  },
  {
    id: 1,
    title: "Upstallweg",
    description: "Upstallweg",
    street: "Upstallweg",
    zipCity: "10319 Berlin",
    category: "Fahrrad",
    photo: "images/kein_bild_vorhanden.png",
    caption: "Fahrradweg",
     lat: "52.4980279",
    lon: "13.5187643"
  },
  {
    id: 2,
    title: "Baustelle Lindenstraße (Köpenick)",
    description: "Baustelle Lindenstraße (Köpenick)",
    street: "Lindenstraße",
    zipCity: "12555 Berlin",
    category: "Straßenverkehr",
    photo: "images/kein_bild_vorhanden.png",
    caption: "Straßenverkehr • Baustellen • Gleisbauarbeiten",
     lat: "52.5069075",
    lon: "13.3981521"
  }
];

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
const placeElements = document.querySelectorAll(".place");
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
   Details für einen Standort anzeigen
-------------------------------------------- */
function openDetailsForLocation(locationId) {
  const loc = LOCATIONS.find(l => l.id === locationId);
  if (!loc) return;

  currentLocationId = loc.id;

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
   Klick auf Standort in der Liste -> Details
-------------------------------------------- */

/* Verhindert, dass ein Klick auf die gesamte Standort-Karte
   das Öffnen des Detail-Screens auslöst. */
placeElements.forEach(placeEl => {
  placeEl.addEventListener("click", (e) => {
    e.stopPropagation(); // verhindert Event-Bubbling zur Titel-Logik
  });
});

/* Aktiviert das Öffnen des Detail-Screens ausschließlich 
   über den Standort-Titel. */
document.querySelectorAll(".place-title").forEach(titleEl => {
  titleEl.style.cursor = "pointer";   

  titleEl.addEventListener("click", (e) => {
    e.stopPropagation();  // verhindert, dass der Klick von der Karte abgefangen wird

    const parentArticle = titleEl.closest(".place");  
    const id = Number(parentArticle.getAttribute("data-id")); 

    openDetailsForLocation(id);   
  });
});


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
document.querySelector("#screen-login form").addEventListener("submit", function (e) {
  e.preventDefault(); // Verhindert Seiten-Reload

  this.classList.add("validated");

  const username = this.querySelector("input[type='text']").value.trim();
  const password = this.querySelector("input[type='password']").value.trim();

  // Benutzer suchen
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    alert("Ungültiger Benutzername oder Passwort!");
    return;
  }

  currentUser = user;

     // Name im Main-Screen setzen
  rbUser.textContent = user.name;

  // Button „Add Location“ nur für Admin
  if (user.role === "admin") {
    addBtn.style.display = "inline-flex";
  } else {
    addBtn.style.display = "none";
  }

  // NEU: Detail-Buttons (Update/Delete/Close) an Rolle anpassen
  updateDetailButtonsForRole();
  

  // Zum Main-Screen wechseln
  showScreen(screenMain);

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
   Neuen Standort in die Liste einfügen
-------------------------------------------- */
function addLocationToList(loc) {
  const article = document.createElement("article");
  article.classList.add("place");
  article.setAttribute("data-id", String(loc.id));

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

  // Klick auf neuen Standort -> Details
  article.addEventListener("click", () => {
    openDetailsForLocation(loc.id);
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
      return; // Add-Screen bleibt offen
    }

    // Neue ID bestimmen
    const newId = LOCATIONS.length > 0
      ? LOCATIONS[LOCATIONS.length - 1].id + 1
      : 0;

    const newLocation = {
      id: newId,
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

    // In Datenstruktur übernehmen
    LOCATIONS.push(newLocation);

    // In DOM-Liste hinzufügen
    addLocationToList(newLocation);

    // Formular zurücksetzen
    addForm.reset();
    addForm.classList.remove("validated");

    // Zurück zum Main-Screen
    showScreen(screenMain);

  } catch (err) {
    console.error(err);
    alert("Es ist ein Fehler beim Geo-Webservice aufgetreten. Bitte später erneut versuchen.");
    // Add-Screen bleibt offen
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
  const loc = LOCATIONS.find(l => l.id === currentLocationId);
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

  /* -------------------------------------------
     Bild aktualisieren (falls ein neues geladen wurde)
     - base64 wird gespeichert
  -------------------------------------------- */
  const fileInput = document.querySelector("#detailImageUpload");
  if (fileInput.files && fileInput.files[0]) {
    loc.photo = await readImageAsBase64(fileInput.files[0]);   // base64 übernehmen
  }

  /* -------------------------------------------
     Adresse vergleichen – nur bei Änderungen geocoden
  -------------------------------------------- */
  const oldFullAddress = loc.street + ", " + loc.zipCity;
  const newFullAddress = newStreet + ", " + newZipCity;

  if (oldFullAddress !== newFullAddress) {

    // Neue Koordinaten anfragen
    const coords = await geocodeAddress(newStreet, newZipCity);

    if (!coords) {
      alert("Für die neue Adresse konnten keine Geo-Koordinaten gefunden werden.");
      return;
    }

    // Koordinaten übernehmen
    loc.lat = coords.lat;
    loc.lon = coords.lon;
  }

  // Textdaten übernehmen
  loc.title = newTitle;
  loc.description = detailDescriptionInput.value.trim();
  loc.street = newStreet;
  loc.zipCity = newZipCity;
  loc.category = newCategory;

  // UI-Liste im Main-Screen aktualisieren
  const article = document.querySelector(`article[data-id="${loc.id}"]`);
  if (article) {
    article.querySelector(".place-title").textContent = loc.title;
    article.querySelector(".place-address").textContent = `${loc.street}, ${loc.zipCity}`;
    article.querySelector(".place-note").textContent = loc.category;
    article.querySelector("img").src = loc.photo;
  }

  // Details schließen
  showScreen(screenMain);

  alert("Standort erfolgreich aktualisiert.");
});


/* -------------------------------------------
   Delete-Handler für das Löschen von Standorten
-------------------------------------------- */
btnDelete.addEventListener("click", function () {

  if (!confirm("Möchten Sie diesen Standort wirklich löschen?")) {
    return;
  }

  // Standort aus Daten entfernen
  const index = LOCATIONS.findIndex(l => l.id === currentLocationId);
  if (index !== -1) {
    LOCATIONS.splice(index, 1);
  }

  // Element aus DOM entfernen
  const article = document.querySelector(`article[data-id="${currentLocationId}"]`);
  if (article) {
    article.remove();
  }

  // Zurück zum Main Screen
  showScreen(screenMain);

  alert("Standort wurde gelöscht.");
});
