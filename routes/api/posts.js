const express = require('express');
const router = express.Router();

/** 
 * @desc    Register user
 * @route   POST api/users
 * @access  Public
**/
router.get('/', (req, res) => res.send("Posts Route"));

module.exports = router;