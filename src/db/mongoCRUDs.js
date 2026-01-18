import { MongoClient, ObjectId } from "mongodb";


// Replace db_user, db_pass, db_name, db_collection
const db_user = 'releaf_berlin_ahmed';
const db_pass = 'l6zuqTagZ';
const db_name = 'releaf_berlin';
const db_collection = 'users';
const locations_collection = "locations";
const dbHostname = "mongodb1.f4.htw-berlin.de"
const dbPort = 27017
const uri = `mongodb://${db_user}:${db_pass}@${dbHostname}:${dbPort}/${db_name}?authSource=${db_name}`;

export const findOneUser  = async function(uNameIn, passwdIn) {
  const client = new MongoClient(uri);
  console.log ("DB: " + uNameIn + "," + passwdIn);
  try {
    const database = client.db(db_name);
    const users = database.collection(db_collection);
    const query = {username: uNameIn, password: passwdIn};
    const doc = await users.findOne(query);
    if (doc) {
      delete doc.password;
    }
    return doc;
  } finally {
    // Ensures that the client will close when finished and on error
    await client.close();
  }
};

export const findAllUsers  = async function() {
  const client = new MongoClient(uri);
  try {  
    const database = client.db(db_name);
    const users = database.collection(db_collection);
    const query = {};
    const cursor = users.find(query);
    // Print a message if no documents were found
    if ((await users.countDocuments(query)) === 0) {
      console.log("No documents found!");
      return null;
    }
    let docs = new Array();
    for await (const doc of cursor) {
      delete doc.password;
      docs.push(doc);
    }
    return docs;
  } finally {
    // Ensures that the client will close when finished and on error
    await client.close();
  }
};

export const findAllLocations = async function() {
  const client = new MongoClient(uri);
  try {  
    const database = client.db(db_name);
    const locations = database.collection(locations_collection);

    const query = {};
    const cursor = locations.find(query);

    if ((await locations.countDocuments(query)) === 0) {
      console.log("No location documents found!");
      return null;
    }

    let docs = new Array();
    for await (const doc of cursor) {
      docs.push(doc);
    }
    return docs;
  } finally {
    await client.close();
  }
};

export const createLocation = async function(locationIn) {
  const client = new MongoClient(uri);
  try {
    const database = client.db(db_name);
    const locations = database.collection(locations_collection);

    // Sicherheitskopie + sicherstellen, dass Client keine IDs setzt
    const doc = { ...locationIn };
    delete doc._id;
    delete doc.id;

    const result = await locations.insertOne(doc);
    return result.insertedId; // MongoDB ObjectId
  } finally {
    await client.close();
  }
};

export const findLocationById = async function(id) {
  const client = new MongoClient(uri);
  try {
    const database = client.db(db_name);
    const locations = database.collection(locations_collection);

    const query = { _id: new ObjectId(id) };
    const doc = await locations.findOne(query);

    return doc; // null wenn nicht gefunden
  } finally {
    await client.close();
  }
};

export const updateLocationById = async function(id, locationIn) {
  const client = new MongoClient(uri);
  try {
    const database = client.db(db_name);
    const locations = database.collection(locations_collection);

    const doc = { ...locationIn };
    delete doc._id;
    delete doc.id;

    const filter = { _id: new ObjectId(id) };
    const update = { $set: doc };

    const result = await locations.updateOne(filter, update);
    return result.matchedCount; // 0 wenn nicht gefunden
  } finally {
    await client.close();
  }
};

export const deleteLocationById = async function(id) {
  const client = new MongoClient(uri);
  try {
    const database = client.db(db_name);
    const locations = database.collection(locations_collection);

    const filter = { _id: new ObjectId(id) };
    const result = await locations.deleteOne(filter);

    return result.deletedCount; // 0 wenn nicht gefunden
  } finally {
    await client.close();
  }
};


