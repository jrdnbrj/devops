import { generateToken } from '../../src/services/jwtService';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('generateToken', () => {
  const mockPayload = { data: 'test' };
  const mockExpiresIn = '1h';
  const mockToken = 'mock.jwt.token';
  const mockJwtSecret = 'mock-jwt-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = mockJwtSecret;
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
  });

  afterEach(() => { jest.clearAllMocks(); });

  it('debe generar un token JWT con el payload y expiración correctos', () => {
    const token = generateToken(mockPayload, mockExpiresIn);

    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      mockJwtSecret,
      { expiresIn: mockExpiresIn }
    );
    expect(token).toBe(mockToken);
  });

  it('debe lanzar un error si JWT_SECRET no está definido', () => {
    delete process.env.JWT_SECRET;

    expect(() => generateToken(mockPayload, mockExpiresIn)).toThrow(
      'JWT_SECRET is not defined'
    );
  });
});