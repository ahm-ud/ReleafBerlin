/* -------------------------------------------
   Benutzer-Daten (statisch laut Beleg 3)
-------------------------------------------- */
const USERS = [
  { username: "admina", password: "password", role: "admin", name: "Mina" },
  { username: "normalo", password: "password", role: "non-admin", name: "Norman" }
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

  // Zum Main-Screen wechseln
  showScreen(screenMain);
});

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
   Details Screen schließen
-------------------------------------------- */
document.querySelector("#closeDetails").addEventListener("click", function () {
  showScreen(screenMain);
});
