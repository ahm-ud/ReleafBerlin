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
    street: "Zachertstraße 84",
    zipCity: "10315 Berlin",
    category: "ÖPNV",
    photo: "images/bvg-friedrichsfelde.jpg",
    caption: "ÖPNV • Werkstatt der Berliner Verkehrsbetriebe",
     lat: null,
    lon: null
  },
  {
    id: 1,
    title: "Upstallweg",
    street: "Upstallweg",
    zipCity: "10319 Berlin",
    category: "Fahrrad",
    photo: "images/kein_bild_vorhanden.png",
    caption: "Fahrradweg",
     lat: null,
    lon: null
  },
  {
    id: 2,
    title: "Baustelle Lindenstraße (Köpenick)",
    street: "Lindenstraße",
    zipCity: "12555 Berlin",
    category: "Straßenverkehr",
    photo: "images/kein_bild_vorhanden.png",
    caption: "Straßenverkehr • Baustellen • Gleisbauarbeiten",
     lat: null,
    lon: null
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
const detailStreetInput = document.querySelector("#detailStreet");
const detailZipCityInput = document.querySelector("#detailZipCity");
const detailCategorySelect = document.querySelector("#detailCategory");
const detailImage = document.querySelector("#detailImage");
const detailImageCaption = document.querySelector("#detailImageCaption");

const btnUpdate = document.querySelector("#btnUpdate");
const btnDelete = document.querySelector("#btnDelete");
const btnCloseDetails = document.querySelector("#closeDetails");

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
   Details für einen Standort anzeigen
-------------------------------------------- */
function openDetailsForLocation(locationId) {
  const loc = LOCATIONS.find(l => l.id === locationId);
  if (!loc) return;

  currentLocationId = loc.id;

  // Formular-Felder befüllen
  detailTitleInput.value = loc.title;
  detailStreetInput.value = loc.street;
  detailZipCityInput.value = loc.zipCity;
  detailCategorySelect.value = loc.category || "";

  // Bild + Caption
  detailImage.src = loc.photo;
  detailImage.alt = loc.title;
  detailImageCaption.textContent = loc.caption || "";

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
    // Falls irgendwas schief läuft: alles aus
    btnUpdate.style.display = "none";
    btnDelete.style.display = "none";
    btnCloseDetails.textContent = "Close";

    // Felder sicherheitshalber sperren
    detailTitleInput.readOnly = true;
    detailStreetInput.readOnly = true;
    detailZipCityInput.readOnly = true;
    detailCategorySelect.disabled = true;
    return;
  }

  if (currentUser.role === "admin") {
    // Admin: darf bearbeiten & löschen
    btnUpdate.style.display = "inline-flex";
    btnDelete.style.display = "inline-flex";
    btnCloseDetails.textContent = "Cancel";

    // Admin darf bearbeiten
    detailTitleInput.readOnly = false;
    detailStreetInput.readOnly = false;
    detailZipCityInput.readOnly = false;
    detailCategorySelect.disabled = false;
  } else {
    // normalo: nur anschauen
    btnUpdate.style.display = "none";
    btnDelete.style.display = "none";
    btnCloseDetails.textContent = "Close";

    // normalo darf nicht bearbeiten
    detailTitleInput.readOnly = true;
    detailStreetInput.readOnly = true;
    detailZipCityInput.readOnly = true;
    detailCategorySelect.disabled = true;
  }
}

/* -------------------------------------------
   Klick auf Standort in der Liste -> Details
-------------------------------------------- */
placeElements.forEach(placeEl => {
  placeEl.addEventListener("click", () => {
    const idStr = placeEl.getAttribute("data-id");
    const id = Number(idStr);
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
  const street = addStreetInput.value.trim();
  const zipCity = addZipCityInput.value.trim();
  const category = addCategorySelect.value;

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
      street,
      zipCity,
      category,
      photo: "images/kein_bild_vorhanden.png", // Standard-Bild
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
