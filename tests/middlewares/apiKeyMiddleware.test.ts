import { Request, Response, NextFunction } from 'express';
import { apiKeyMiddleware } from '../../src/middlewares/apiKeyMiddleware';

describe('apiKeyMiddleware', () => {
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

  it('debe permitir la solicitud cuando el API Key es correcto', () => {
    req.headers!['x-parse-rest-api-key'] = mockApiKey;

    apiKeyMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el API Key es incorrecto', () => {
    req.headers!['x-parse-rest-api-key'] = 'incorrect-api-key';

    apiKeyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar la solicitud cuando el API Key no está presente', () => {
    apiKeyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });
});
