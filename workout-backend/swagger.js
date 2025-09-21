import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const router = Router();
const spec = {
  openapi: '3.0.0',
  info: { title: 'Workout API', version: '1.0.0' },
  paths: {
    '/api/health': { get: { summary: 'Health', responses: { '200': { description: 'ok' } } } }
  }
};
router.use('/', swaggerUi.serve, swaggerUi.setup(spec));
export default router;
