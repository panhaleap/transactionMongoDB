const express = require("express");
const router = express.Router();

const Song = require("../models/song");
const Singer = require("../models/singer");

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

router.route("/").post(async (req, res) => {
  try {
    const { name, genre, rating, singers } = req.body;
    const song = new Song({ name, genre, rating, singers });

    await song.save();
    res.status(201).json({ message: "Singer was created!" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});


router.route("/").get(async (req, res) => {
  try {
    let { limit, skip, name } = req.query;
    const filterByName = name ? { name } : {};
    const conditionBySingerName = name ? condiSearchByName(filterByName) : {};

    const filterByLimit = limit ? +limit : (limit = 10);
    const filterBySkip = skip ? +skip : (skip = 0);

    const [singers] = await Promise.all([
        Singer.find(conditionBySingerName)
          .skip(filterBySkip)
          .limit(filterByLimit)
      ]);    

    const condition = singers ? {singers: { $in: singers }} : {};
    //return res.status(200).json({message : condition});

    const [songs, total] = await Promise.all([
        Song.find(condition)
          .populate("singers")
          .skip(filterBySkip)
          .limit(filterByLimit),
        Song.count(condition)
      ]);

      if (!songs) {
        res.status(404).json({ message: "Song not found" });
      } else {
        res.status(200).json({
          message: "Found",
          "Data":songs,
          options: {
            limit: +limit,
            skip: +skip,
            total
          }
        });
      }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

router.route("/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findOne({ _id: id, isActive: true }).populate(
      "singers"
    );

    if (!song) {
      res.status(404).json({ message: "Song not found" });
    } else {
      res.status(200).json({ message: "Found", song });
    }
  } catch (error) {
    const { name } = error;
    if (name === "CastError") {
      res.status(404).json({ message: "Song not found" });
    } else {
      res.status(500).json({ message: error });
    }
  }
});

router.route("/:id").put(async (req, res) => {
  try {
    const data = req.body;
    const { id } = req.params;
    const song = await Song.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data }
    );

    if (!song) {
      res.status(404).json({ message: "Song not found." });
    } else {
      res.status(200).json({ message: "Song was updated!" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    debug(error);
  }
  // =========================
});

router.route("/:id").delete(async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } }
    );

    if (song !== null && song.isActive) {
      res.status(200).json({ message: "Song was deleted!" });
    } else {
      res.status(404).json({ message: "Song not found." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    debug(error);
  }
});

module.exports = router;