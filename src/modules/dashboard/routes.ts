import { Router } from 'express';
import { DashboardService } from './service';
import { DashboardController } from './controller';
import { authGuard, requireRoles } from '../../middlewares/auth';

const router = Router();
const controller = new DashboardController(new DashboardService());

router.use(authGuard);
router.use(requireRoles('Admin'));

router.get('/kpis', controller.getKpis);
router.get('/top-sold', controller.getTopSold);

export default router;
