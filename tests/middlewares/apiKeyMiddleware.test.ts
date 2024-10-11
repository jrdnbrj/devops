import { Request, Response, NextFunction } from 'express';
import { apiKeyMiddleware } from '../../src/middlewares/apiKeyMiddleware';

describe('API Key Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const mockApiKey = 'mock-api-key';

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();

    process.env.API_KEY = mockApiKey;
  });

  it('Should allow the request when the API Key is correct.', () => {
    req.headers!['x-parse-rest-api-key'] = mockApiKey;

    apiKeyMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('Should reject the request when the API Key is incorrect', () => {
    req.headers!['x-parse-rest-api-key'] = 'incorrect-api-key';

    apiKeyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('Should reject the request when the API Key is not present', () => {
    apiKeyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });
});
