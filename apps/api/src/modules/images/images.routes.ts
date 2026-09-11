import { FastifyInstance } from 'fastify';
import {
  uploadImageHandler,
  getCaseImagesHandler,
  getImageAnalysisHandler,
  getImageOriginHandler,
} from './images.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

export async function imagesRoutes(fastify: FastifyInstance) {
  fastify.register(async function (fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    // Upload image to case
    fastify.post<{
      Params: { caseId: string };
    }>(
      '/:caseId/images',
      {
        preHandler: authorize('cases', 'write'),
      },
      uploadImageHandler
    );

    // List images for case
    fastify.get<{
      Params: { caseId: string };
    }>(
      '/:caseId/images',
      {
        preHandler: authorize('cases', 'read'),
      },
      getCaseImagesHandler
    );

    // Get specific image analysis
    fastify.get<{
      Params: { caseId: string; id: string };
    }>(
      '/:caseId/images/:id',
      {
        preHandler: authorize('cases', 'read'),
      },
      getImageAnalysisHandler
    );

    // Get image origin analysis
    fastify.get<{
      Params: { caseId: string; imageId: string };
    }>(
      '/:caseId/images/:imageId/origin',
      {
        preHandler: authorize('cases', 'read'),
      },
      getImageOriginHandler
    );
  });
}
