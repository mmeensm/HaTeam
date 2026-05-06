const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/auth');

router.get('/', projectController.getAllProjects);
router.post('/', verifyToken, projectController.createProject);
router.put('/:projectId', verifyToken, projectController.updateProject);
router.delete('/:projectId', verifyToken, projectController.deleteProject);
router.post('/:id/join', verifyToken, projectController.joinProject);
router.get('/:id/applicants', verifyToken, projectController.getApplicants);
router.post('/:id/accept', verifyToken, projectController.acceptApplicant);
router.post('/:id/reject', verifyToken, projectController.rejectApplicant);

module.exports = router;

