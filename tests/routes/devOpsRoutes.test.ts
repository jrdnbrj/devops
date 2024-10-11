import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../src/services/redisService';

jest.mock('jsonwebtoken');
jest.mock('../../src/services/redisService', () => ({
  redisClient: { setEx: jest.fn(), get: jest.fn(), del: jest.fn() },
}));

describe('DevOps Routes', () => {
  const API_KEY = '2f5ae96c-b558-4c7b-a590-a501ae1c3f6c';
  const JWT_SECRET = 'test-jwt-secret';
  const SUPER_TOKEN = 'super.jwt.token';

  beforeAll(() => {
    process.env.API_KEY = API_KEY;
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => { jest.clearAllMocks(); });

  describe('POST /DevOps', () => {
    it('Should return success message and token when payload is valid', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      const generatedToken = 'test.jwt.token';
      const superDecodedToken = { iss: 'super-token' };

      (jwt.sign as jest.Mock).mockReturnValue(generatedToken);

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: `Hello ${payload.to} your message will be sent`,
      });
      expect(response.headers['x-jwt-kwy']).toBe('Bearer ' + generatedToken);

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

    it('Should return error 400 when payload is invalid', async () => {
      const payload = { message: 'This is a test', to: 'Juan Perez' };

      const superDecodedToken = { iss: 'super-token' };

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid payload' });
    });

    it('Should return 403 when API Key is invalid', async () => {
      const payload = {
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      };

      const superDecodedToken = { iss: 'super-token' };

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .post('/DevOps')
        .set('x-parse-rest-api-key', 'invalid-api-key')
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN)
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Forbidden');
    });
  });

  describe('Other HTTP methods in /DevOps', () => {
    it('Should return "ERROR" for GET method', async () => {
      const superDecodedToken = { iss: 'super-token' };

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .get('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN);

      expect(response.status).toBe(200);
      expect(response.text).toBe('ERROR');
    });

    it('Should return "ERROR" for PUT method', async () => {
      const superDecodedToken = { iss: 'super-token' };

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .put('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN)
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('ERROR');
    });

    it('Should return "ERROR" for DELETE method', async () => {
      const superDecodedToken = { iss: 'super-token' };

      (jwt.verify as jest.Mock).mockReturnValue(superDecodedToken);

      const response = await request(app)
        .delete('/DevOps')
        .set('x-parse-rest-api-key', API_KEY)
        .set('x-jwt-kwy', 'Bearer ' + SUPER_TOKEN);

      expect(response.status).toBe(200);
      expect(response.text).toBe('ERROR');
    });
  });
});