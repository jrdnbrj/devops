import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { checkTokenUniqueness } from '../../src/middlewares/jwtMiddleware';
import { redisClient } from '../../src/services/redisService';

jest.mock('jsonwebtoken');
jest.mock('../../src/services/redisService', () => ({
  redisClient: {
    get: jest.fn(),
    del: jest.fn(),
  },
}));

describe('checkTokenUniqueness', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const mockJwtSecret = 'mock-jwt-secret';

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();

    process.env.JWT_SECRET = mockJwtSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe permitir la solicitud cuando el token es válido y está en Redis', async () => {
    const token = 'Bearer valid-token';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'my-key', jti: 'unique-jti' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    (redisClient.get as jest.Mock).mockResolvedValue('valid');

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', mockJwtSecret);
    expect(redisClient.get).toHaveBeenCalledWith('unique-jti');
    expect(redisClient.del).toHaveBeenCalledWith('unique-jti');
    expect(next).toHaveBeenCalled();
  });

  it('debe permitir la solicitud cuando el token es un super-token', async () => {
    const token = 'Bearer super-token';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'super-token' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('super-token', mockJwtSecret);
    expect(redisClient.get).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el token no tiene jti', async () => {
    const token = 'Bearer token-without-jti';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'my-key' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing jti');
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el token no está en Redis', async () => {
    const token = 'Bearer valid-token-not-in-redis';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'my-key', jti: 'non-existent-jti' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el token es inválido', async () => {
    const token = 'Bearer invalid-token';
    req.headers!['x-jwt-kwy'] = token;

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el header x-jwt-kwy no está presente', async () => {
    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el token tiene un formato inválido', async () => {
    req.headers!['x-jwt-kwy'] = 'InvalidTokenFormat';

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });
});