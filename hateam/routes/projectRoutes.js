const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/auth');

router.get('/', projectController.getAllProjects);
router.post('/', verifyToken, projectController.createProject);
router.put('/:projectId', verifyToken, projectController.updateProject);
router.delete('/:projectId', verifyToken, projectController.deleteProject);

module.exports = router;