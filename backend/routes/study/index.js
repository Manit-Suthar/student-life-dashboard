const express = require("express");
const router = express.Router();

const studyRoutes = require("./study.routes");

router.use("/", studyRoutes);

module.exports = router;
