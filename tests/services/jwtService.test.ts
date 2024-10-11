import { generateToken } from '../../src/services/jwtService';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JWT Service', () => {
  const mockPayload = { data: 'test' };
  const mockExpiresIn = '1h';
  const mockToken = 'mock.jwt.token';
  const mockJwtSecret = 'mock-jwt-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = mockJwtSecret;
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
  });

  afterEach(() => { jest.clearAllMocks(); });

  it('Must generate a JWT token with the correct payload and expiration', () => {
    const token = generateToken(mockPayload, mockExpiresIn);

    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      mockJwtSecret,
      { expiresIn: mockExpiresIn }
    );
    expect(token).toBe(mockToken);
  });

  it('Must throw an error if JWT_SECRET is not defined', () => {
    delete process.env.JWT_SECRET;

    expect(() => generateToken(mockPayload, mockExpiresIn)).toThrow(
      'JWT_SECRET is not defined'
    );
  });
});