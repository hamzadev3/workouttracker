// apps/api/src/docs/openapi.js
const pkg = { name: 'WorkoutTracker API', version: '1.0.0' };

const openapi = {
  openapi: '3.0.3',
  info: { title: pkg.name, version: pkg.version, description: 'REST API for WorkoutTracker' },
  servers: [{ url: 'http://localhost:8080' }],
  tags: [{ name: 'sessions' }],
  paths: {
    '/health': {
      get: {
        tags: ['misc'],
        summary: 'Health check',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: {
            status: { type: 'string' }, db: { type: 'string' }
          }}}}}}
        }
      }
    },
    '/api/sessions': {
      get: {
        tags: ['sessions'],
        summary: 'List sessions (community if no userId; user + community if userId)',
        parameters: [
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Session' }}}}}
        }
      },
      post: {
        tags: ['sessions'],
        summary: 'Create a session (requires auth)',
        security: [{ bearerAuth: [] }, { headerUid: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSession' } } }
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' }}}},
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/sessions/{id}': {
      delete: {
        tags: ['sessions'],
        summary: 'Delete a session (owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
      }
    },
    '/api/sessions/{id}/exercise': {
      post: {
        tags: ['sessions'],
        summary: 'Add exercise (owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } } },
        responses: { 200: { description: 'Updated session' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
      }
    },
    '/api/sessions/{id}/exercise/{idx}': {
      delete: {
        tags: ['sessions'],
        summary: 'Remove exercise by index (owner only)',
        parameters: [
          { name: 'id',  in: 'path', required: true, schema: { type: 'string' } },
          { name: 'idx', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Updated session' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
      }
    }
  },
components= {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      headerUid:  { type: 'apiKey', in: 'header', name: 'x-user-id' }
    },
    schemas: {
      Exercise: {
        type: 'object',
        required: ['title','sets','reps','weight'],
        properties: {
          title:  { type: 'string' },
          sets:   { type: 'integer' },
          reps:   { type: 'integer' },
          weight: { type: 'number' }
        }
      },
      Session: {
        type: 'object',
        required: ['name','date'],
        properties: {
          _id:      { type: 'string' },
          name:     { type: 'string' },
          date:     { type: 'string', format: 'date-time' },
          userId:   { type: 'string' },
          userName: { type: 'string' },
          isPublic: { type: 'boolean' },
          exercises:{ type: 'array', items: { $ref: '#/components/schemas/Exercise' } }
        }
      },
      CreateSession: {
        type: 'object',
        required: ['name','userId'],
        properties: {
          name:     { type: 'string' },
          date:     { type: 'string', format: 'date-time' },
          userId:   { type: 'string' },
          userName: { type: 'string' },
          isPublic: { type: 'boolean', default: true }
        }
      }
    }
  }


module.exports = openapi;
