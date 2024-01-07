const { Op } = require("sequelize");
const moment = require("moment-timezone");
require("dotenv").config();

const { Bot3: Post } = require("../../models/bot3");
const { sequelize } = require("../utils/db");

async function getBin() {
  return Post.findAll({
    where: {
      will_delete_date: {
        [Op.not]: null,
      },
    },
    raw: true,
  });
}

async function getAll() {
  return Post.findAll({
    where: {
      will_delete_date: {
        [Op.eq]: null,
      },
    },
  });
}

async function deleteAll() {
  return Post.destroy({
    where: {},
    truncate: true,
  });
}

async function getCountAll() {
  return Post.count({
    where: {
      will_delete_date: {
        [Op.eq]: null,
      },
    },
  });
}

async function getOneByFUI(file_unique_id) {
  return Post.findOne({
    where: {
      file_unique_id,
    },
  });
}

async function moveToQueueFromBinByFUI(file_unique_id) {
  return Post.update(
    { will_delete_date: null },
    {
      where: {
        file_unique_id,
      },
    }
  );
}

async function addToBinByFUI(file_unique_id) {
  return Post.update(
    { will_delete_date: moment().tz("Europe/Kiev").add("day", 1) },
    {
      where: {
        file_unique_id,
      },
    }
  );
}

async function create(post) {
  return Post.create(post);
}

async function updateImageUrlByFUI(imageUrl, file_unique_id) {
  return Post.update(
    {
      imageUrl,
    },
    {
      where: {
        file_unique_id,
      },
    }
  );
}

async function getNextPost() {
  let options = {
    where: {
      will_delete_date: {
        [Op.eq]: null,
      },
    },
  };

  if (global.isRandom) {
    options = {
      ...options,
      order: sequelize.random(),
    };
  } else {
    options = {
      ...options,
      order: [["sendedAt", "ASC"]],
    };
  }

  return Post.findOne(options);
}

async function getLastFromBin() {
  return Post.findOne({
    where: {
      will_delete_date: {
        [Op.not]: null,
      },
    },
    order: [["will_delete_date", "ASC"]],
  });
}

async function deleteFromBinById(id) {
  return Post.destroy({
    where: {
      id,
    },
  });
}

async function getFirstPhotoMediaGroup(media_group_id) {
  return Post.findOne({
    where: {
      media_group_id,
      will_delete_date: {
        [Op.eq]: null,
      },
    },
    order: [["sendedAt", "ASC"]],
  });
}

async function deleteById(id) {
  return Post.destroy({
    where: {
      id,
    },
  });
}

async function deleteByIds(ids) {
  return Post.destroy({
    where: {
      id: ids,
    },
  });
}

async function getAllByMediaGroup(media_group_id) {
  return Post.findAll({
    where: {
      media_group_id,
      will_delete_date: {
        [Op.eq]: null,
      },
    },
    order: [["sendedAt", "ASC"]],
  });
}

module.exports = {
  getBin,
  getAll,
  deleteAll,
  getCountAll,
  getOneByFUI,
  moveToQueueFromBinByFUI,
  addToBinByFUI,
  create,
  updateImageUrlByFUI,
  getNextPost,
  getLastFromBin,
  deleteFromBinById,
  getFirstPhotoMediaGroup,
  deleteById,
  deleteByIds,
  getAllByMediaGroup,
};
