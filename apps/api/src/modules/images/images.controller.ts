import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadImage, getCaseImages, getImageAnalysis, getImageOrigin } from './images.service';
import { SecurityError } from '@monara-sentinel/security';

export async function uploadImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { caseId } = req.params as { caseId: string };

  try {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded', code: 'NO_FILE' });
    }

    const result = await uploadImage(
      caseId,
      user.organizationId,
      user.id,
      data,
      data.filename
    );

    return reply.status(201).send(result);
  } catch (e) {
    if (e instanceof SecurityError) {
      return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({
        error: e.name,
        message: e.message,
        code: e.code,
      });
    }
    throw e;
  }
}

export async function getCaseImagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { caseId } = req.params as { caseId: string };

  try {
    const images = await getCaseImages(caseId, user.organizationId);
    return reply.send({ items: images });
  } catch (e) {
    if (e instanceof SecurityError) {
      return reply.status(404).send({ error: 'Not Found', code: e.code });
    }
    throw e;
  }
}

export async function getImageAnalysisHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { caseId, id } = req.params as { caseId: string; id: string };

  try {
    const imageAnalysis = await getImageAnalysis(id, caseId, user.organizationId);
    return reply.send(imageAnalysis);
  } catch (e) {
    if (e instanceof SecurityError) {
      return reply.status(404).send({ error: 'Not Found', code: e.code });
    }
    throw e;
  }
}

export async function getImageOriginHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { caseId, imageId } = req.params as { caseId: string; imageId: string };

  try {
    const originAnalysis = await getImageOrigin(caseId, imageId, user.id);
    return reply.send(originAnalysis);
  } catch (e) {
    if (e instanceof SecurityError) {
      return reply.status(404).send({ error: 'Not Found', code: e.code });
    }
    throw e;
  }
}
