const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multerConfig');
const {
  listDocuments,
  uploadDocument,
  getDocument,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');

router.get('/facilities/:facilityId/documents', authenticateToken, listDocuments);
router.post('/facilities/:facilityId/documents/upload', authenticateToken, upload.single('file'), uploadDocument);
router.get('/documents/:documentId', authenticateToken, getDocument);
router.get('/documents/:documentId/download', authenticateToken, downloadDocument);
router.delete('/documents/:documentId', authenticateToken, deleteDocument);

module.exports = router;
