import { Router } from "express";
import { findAllLocations, createLocation, findLocationById, updateLocationById, deleteLocationById } from "../db/mongoCRUDs.js";



let locRouter = Router();

// POST http://localhost:8000/loc
locRouter.post("/", async function (req, res) {
  try {
    const newId = await createLocation(req.body);

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
locRouter.put("/:id", async function (req, res) {
  try {
    const id = req.params.id;

    const matched = await updateLocationById(id, req.body);
    if (matched === 0) {
      res.status(404).send("Location not found!");
      return;
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

    const deleted = await deleteLocationById(id);
    if (deleted === 0) {
      res.status(404).send("Location not found!");
      return;
    }

    // 204: keine Payload
    res.status(204).end();
  } catch (err) {
    console.log(err);
    res.status(400).send("Something is not right!!");
  }
});




export default locRouter;
