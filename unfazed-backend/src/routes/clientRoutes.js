const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { requireTherapistAuth } = require('../middleware/authMiddleware');

router.use(requireTherapistAuth);

router.get('/', clientController.getClients);
router.post('/', clientController.createClient);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);

module.exports = router;
