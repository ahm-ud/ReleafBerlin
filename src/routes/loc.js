import { Router } from "express";
import multer from "multer";
import { join, extname } from "path";
import fs from "fs";
import { findAllLocations, createLocation, findLocationById, updateLocationById, deleteLocationById } from "../db/mongoCRUDs.js";



let locRouter = Router();

// ----------------------------------------------------
// Upload-Konfiguration
// ----------------------------------------------------

const UPLOAD_DIR = join(process.cwd(), "public/uploads");
const DEFAULT_PHOTO = "images/kein_bild_vorhanden.png";

// Ordner sicherstellen
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Nur Bilder erlauben
function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien sind erlaubt!"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


// POST http://localhost:8000/loc
locRouter.post("/", upload.single("image"), async function (req, res) {
  try {

    // Wenn Bild hochgeladen wurde -> URL setzen
    const photoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : DEFAULT_PHOTO;

    const payload = {
      ...req.body,
      photo: photoUrl,
    };

    const newId = await createLocation(payload);

    // 201 + Location Header, keine Payload
    res.status(201).set("Location", `/loc/${newId}`).end();

  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});


// GET http://localhost:8000/loc
locRouter.get("/", async function (req, res) {
  try {
    const locations = await findAllLocations();
    if (locations) {
      res.status(200).json(locations);
    } else {
      res.status(404).send("Locations not found!");
    }
  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});

// GET http://localhost:8000/loc/:id
locRouter.get("/:id", async function (req, res) {
  try {
    const id = req.params.id;

    const loc = await findLocationById(id);
    if (!loc) {
      res.status(404).send("Location not found!");
      return;
    }

    res.status(200).json(loc);
  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});

// PUT http://localhost:8000/loc/:id
locRouter.put("/:id", upload.single("image"), async function (req, res) {
  try {
    const id = req.params.id;

    const existing = await findLocationById(id);
    if (!existing) {
      return res.status(404).send("Location not found!");
    }

    const removeImage = req.body.removeImage === "true";

    let newPhoto = existing.photo;

    // Wenn neue Datei hochgeladen wurde -> altes Bild löschen + neues setzen
    if (req.file) {
      if (existing.photo && existing.photo.startsWith("/uploads/")) {
        const oldPath = join(process.cwd(), "public", existing.photo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      newPhoto = `/uploads/${req.file.filename}`;
    }

    // Wenn removeImage = true -> altes löschen + Default setzen
    if (removeImage) {
      if (existing.photo && existing.photo.startsWith("/uploads/")) {
        const oldPath = join(process.cwd(), "public", existing.photo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      newPhoto = DEFAULT_PHOTO;
    }

    const payload = {
      ...req.body,
      photo: newPhoto,
    };

    const matched = await updateLocationById(id, payload);

    if (matched === 0) {
      return res.status(404).send("Location not found!");
    }

    // 204: keine Payload
    res.status(204).end();

  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});


// DELETE http://localhost:8000/loc/:id
locRouter.delete("/:id", async function (req, res) {
  try {
    const id = req.params.id;

    const existing = await findLocationById(id);
    if (!existing) {
      return res.status(404).send("Location not found!");
    }

    // Wenn Bild aus uploads stammt -> löschen
    if (existing.photo && existing.photo.startsWith("/uploads/")) {
      const oldPath = join(process.cwd(), "public", existing.photo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const deleted = await deleteLocationById(id);

    if (deleted === 0) {
      return res.status(404).send("Location not found!");
    }

    // 204: keine Payload
    res.status(204).end();

  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});





export default locRouter;
