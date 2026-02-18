const express = require("express");
const router = express.Router();

const assignmentsRoutes = require("./assignments.routes");

router.use("/", assignmentsRoutes);

module.exports = router;
