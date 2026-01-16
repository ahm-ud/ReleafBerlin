import { Router } from "express";
import { findAllLocations } from "../db/mongoCRUDs.js";

let locRouter = Router();

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

export default locRouter;
