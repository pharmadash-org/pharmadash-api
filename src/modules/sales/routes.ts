import { Router } from 'express';
import { SaleRepository } from './repository';
import { SaleService } from './service';
import { SaleController } from './controller';
import { authGuard, requireRoles } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createSaleSchema } from './schema';

const router = Router();
const controller = new SaleController(new SaleService(new SaleRepository()));

router.use(authGuard);

router.post('/', requireRoles('Admin', 'Vendedor'), validateBody(createSaleSchema), controller.create);

export default router;
