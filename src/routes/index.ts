import { Router } from 'express';
import anilistController from '@controllers/anilist';

const routes: Router = Router();

routes.get('/:type/:method', anilistController.handler);

export default routes;
