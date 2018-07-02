const express = require("express");
const router = express.Router();

const Singer = require("../models/singer");

function splitName(name, reverse) {
  const splitName = name.split(" ", 2);
  if (reverse) {
    splitName.reverse;
  }
  return splitName;
}

function regularName(splitName) {
  return new RegExp(`${splitName[0]}`, "i");
}

function condiSearchByName(filterByName) {
  let wordSplit = { ...filterByName }.name.split(" ", 2);

  wordSplit.forEach((word, index, theArray) => {
    theArray[index] = new RegExp(`${word.trim()}`, "i");
  });

  const twoWordCondition = {
    $or: [
      { $and: [{ firstName: wordSplit[0] }, { lastName: wordSplit[1] }] },
      { $and: [{ firstName: wordSplit[1] }, { lastName: wordSplit[0] }] }
    ]
  };

  const oneWordCondition = {
    $or: [{ firstName: wordSplit[0] }, { lastName: wordSplit[0] }]
  };

  return wordSplit.length < 2 ? oneWordCondition : twoWordCondition;
}

router.route("/singers").post(async (req, res) => {
  try {
    const { firstName, lastName, gender } = req.body;
    const singer = new Singer({ firstName, lastName, gender });
    console.log(singer);
    await singer.save();
    res.status(201).json({ message: "Singer was created!", singer });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.route("/singers").get(async (req, res) => {
  try {
    let { limit, skip, isActive = false } = req.query;
    const filterByActive = isActive ? { isActive } : {};
    const condition = { ...filterByActive };
    const filterByLimit = limit ? +limit : (limit = 10);
    const filterBySkip = skip ? +skip : (skip = 0);
    
    const [singers, total] = await Promise.all([
      Singer.find(condition)
        .skip(filterBySkip)
        .limit(filterByLimit),
      Singer.count(condition)
    ]);

    res.status(200).json({
      message: 'Success',
      'Data': singers,
      options: {
        limit,
        skip,
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

router.route("/singers/name").get(async (req, res) => {
  try {
    let { limit = 20, skip = 0, isActive, gender, name } = req.query;
    limit = +limit;
    skip = +skip;
    limit = (limit > 100)? 100: limit;
    
    const filterByActive = isActive ? { isActive } : { isActive: true };
    const filterByGender = gender? { gender: { $in: gender } }: { gender: { $in: ["male", "female"] } };
    const filterByName = name ? { name } : {};

    const conditionByName = name ? condiSearchByName(filterByName) : {};

    const condition = { ...filterByActive, ...filterByGender };

    const [singers, total] = await Promise.all([
      Singer.find(conditionByName).find(condition)
        .skip(skip)
        .limit(limit),
      Singer.count(condition)
    ]);

    res.status(200).json({
      message: "Success",
      "Data": singers,
      options: {
        limit: limit,
        skip: +skip,
        total
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.route("/singers/:id").get(async (req, res) => {
    try {
      const { id } = req.params;
      const singer = await Singer.findOne({ _id: id, isActive: true });
      if (!singer) {
        res.status(404).json({ message: "Singer not found" });
      } else {
        res.status(200).json({ message: "Found", "Data": singer });
      }
    } catch (error) {
      const msgError = (error.name == 'CastError') ? 'Wrong id format' : error;
      res.status(500).json(msgError);
    }
  });

router.route("/singers/:id").put(async (req, res) => {
  //======================
  try {
    const { id } = req.params;
    const singer = await Singer.findOne({ _id: id, isActive: true });
    if (!singer) {
      res.status(404).json({ message: "Singer not found" });
    } else {
      //======================
      const { first_name, last_name, gender } = req.body;
      singer.first_name = first_name;
      singer.last_name = last_name;
      singer.gender = gender;
      //======================
      await singer.save();
      res.status(200).json({ message: "Singer was updated!" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

router.route("/singers/:id").delete(async (req, res) => {
  try {
    //======================
    const { id } = req.params;
    const singer = await Singer.findByIdAndUpdate({ _id: id, isActive: true },{ $set: { isActive: false } });

    if (singer !== null && singer.isActive) {
      res.status(200).json({ message: "Singer was deleted" });
    } else {
      res.status(404).json({ message: "Singer not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

module.exports = router;
