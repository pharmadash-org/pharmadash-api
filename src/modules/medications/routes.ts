import { Router } from 'express';
import { MedicationRepository } from './repository';
import { MedicationService } from './service';
import { MedicationController } from './controller';
import { authGuard, requireRoles } from '../../middlewares/auth';
import { validateBody, validateQuery } from '../../middlewares/validate';
import {
  createMedicationSchema,
  updateMedicationSchema,
  listMedicationsQuerySchema,
  searchQuerySchema,
} from './schema';

const router = Router();
const controller = new MedicationController(new MedicationService(new MedicationRepository()));

router.use(authGuard);

router.get('/', validateQuery(listMedicationsQuerySchema), controller.list);
router.get('/search', validateQuery(searchQuerySchema), controller.search);
router.get('/:id', controller.getById);
router.post('/', requireRoles('Admin'), validateBody(createMedicationSchema), controller.create);
router.put(
  '/:id',
  requireRoles('Admin'),
  validateBody(updateMedicationSchema),
  controller.update,
);
router.delete('/:id', requireRoles('Admin'), controller.delete);

export default router;
