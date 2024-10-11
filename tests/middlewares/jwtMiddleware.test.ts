import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { checkTokenUniqueness } from '../../src/middlewares/jwtMiddleware';
import { redisClient } from '../../src/services/redisService';

jest.mock('jsonwebtoken');
jest.mock('../../src/services/redisService', () => ({
  redisClient: { get: jest.fn(), del: jest.fn() },
}));

describe('JWT Middleware', () => {
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

  afterEach(() => { jest.clearAllMocks(); });

  it('Should allow the request when the token is valid and in Redis.', async () => {
    const token = 'valid-token';
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

  it('Should allow the request when the token is a super-token', async () => {
    const token = 'super-token';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'super-token' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('super-token', mockJwtSecret);
    expect(redisClient.get).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should reject the request when the token does not have jti', async () => {
    const token = 'token-without-jti';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'my-key' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing jti');
    expect(next).not.toHaveBeenCalled();
  });

  it('Should reject the request when the token is not in Redis', async () => {
    const token = 'valid-token-not-in-redis';
    req.headers!['x-jwt-kwy'] = token;

    const decodedToken = { iss: 'my-key', jti: 'non-existent-jti' };

    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Should reject the request when the token is invalid', async () => {
    const token = 'invalid-token';
    req.headers!['x-jwt-kwy'] = token;

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('Should reject the request when the x-jwt-kwy header is not present', async () => {
    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('Should reject the request when the token has an invalid format', async () => {
    req.headers!['x-jwt-kwy'] = 'InvalidTokenFormat';

    await checkTokenUniqueness(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: invalid token');
    expect(next).not.toHaveBeenCalled();
  });
});