const router = require('express').Router();
const multer = require('multer');
const authenticate = require('../middleware/auth');
const {
  uploadDocument,
  getUserDocuments,
  getDocumentDetail,
  askDocumentQuestion,
  reprocessDocument,
  deleteDocument,
} = require('../controllers/documentController');

// Configure multer: store in memory, limit 10MB, accept only PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

// All document routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getUserDocuments);
router.get('/:id', getDocumentDetail);
router.post('/:id/ask', askDocumentQuestion);
router.post('/:id/reprocess', reprocessDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
