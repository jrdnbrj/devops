import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../src/services/redisService';

jest.mock('jsonwebtoken');
jest.mock('../../src/services/redisService', () => ({
  redisClient: {
    get: jest.fn(),
    del: jest.fn(),
    setEx: jest.fn(),
  },
}));

describe('Integration Test: App', () => {
  const API_KEY = '2f5ae96c-b558-4c7b-a590-a501ae1c3f6c';
  const JWT_SECRET = 'test-jwt-secret';
  const SUPER_TOKEN = 'super.jwt.token';

  beforeAll(() => {
    process.env.API_KEY = API_KEY;
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => { jest.clearAllMocks(); });

  describe('Full Integration Flow', () => {
    it('Should process a valid request successfully', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      const generatedToken = 'test.jwt.token';
      const jtiValue = 'unique-jti-value';

      (jwt.sign as jest.Mock).mockImplementation(() => generatedToken);

      (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
        if (token === 'super-token') return { iss: 'super-token' };
        else return { iss: 'my-key', jti: jtiValue, ...payload };
      });

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'super-token')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: `Hello ${payload.to} your message will be sent`,
      });
      expect(response.headers['x-jwt-kwy']).toBe('' + generatedToken);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          message: payload.message,
          to: payload.to,
          from: payload.from,
          timeToLifeSec: payload.timeToLifeSec,
          jti: expect.any(String),
          iss: 'my-key',
        }),
        JWT_SECRET,
        { expiresIn: payload.timeToLifeSec + 's' }
      );

      expect(redisClient.setEx).toHaveBeenCalledWith(
        expect.any(String),
        payload.timeToLifeSec,
        'valid'
      );
    });

    it('Should fail when API Key is missing', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      const response = await request(app)
        .post('/DevOps')
        .set('x-jwt-kwy', 'super-token')
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Forbidden');
    });

    it('Should fail when JWT token is missing', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.text).toContain('Invalid or expired token');
    });

    it('Should handle invalid JWT token', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'invalid-token')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.text).toContain('Unauthorized');
    });

    it('Should handle requests with other HTTP methods', async () => {
      const methods = ['get', 'put', 'delete', 'patch'];

      for (const method of methods) {
        (jwt.verify as jest.Mock).mockReturnValue({ iss: 'super-token' });

        const response = await (request(app) as any)[method]('/DevOps')
          .set('x-parse-rest-api-key', API_KEY)
          .set('x-jwt-kwy', 'super-token');

        expect(response.status).toBe(200);
        expect(response.text).toBe('ERROR');
      }
    });
  });
});