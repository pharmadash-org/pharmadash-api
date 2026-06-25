import {
  AppException,
  ValidationException,
  NotFoundException,
  ConflictException,
  UnprocessableException,
  UnauthorizedException,
  ForbiddenException,
} from './index';

describe('exceptions', () => {
  it('AppException stores statusCode, code, message, details', () => {
    const ex = new AppException(418, 'TEAPOT', 'I am a teapot', { foo: 'bar' });
    expect(ex.statusCode).toBe(418);
    expect(ex.code).toBe('TEAPOT');
    expect(ex.message).toBe('I am a teapot');
    expect(ex.details).toEqual({ foo: 'bar' });
    expect(ex).toBeInstanceOf(Error);
  });

  it('ValidationException → 400', () => {
    const ex = new ValidationException([{ field: 'name' }]);
    expect(ex.statusCode).toBe(400);
    expect(ex.code).toBe('VALIDATION_ERROR');
    expect(ex.details).toEqual([{ field: 'name' }]);
  });

  it('NotFoundException → 404 with resource and id in message', () => {
    const ex = new NotFoundException('Medication', 'abc');
    expect(ex.statusCode).toBe(404);
    expect(ex.code).toBe('NOT_FOUND');
    expect(ex.message).toContain('Medication');
    expect(ex.message).toContain('abc');
  });

  it('ConflictException → 409', () => {
    const ex = new ConflictException('SKU exists');
    expect(ex.statusCode).toBe(409);
    expect(ex.code).toBe('CONFLICT');
  });

  it('UnprocessableException → 422 with details', () => {
    const ex = new UnprocessableException('No stock', { available: 0 });
    expect(ex.statusCode).toBe(422);
    expect(ex.code).toBe('UNPROCESSABLE_ENTITY');
    expect(ex.details).toEqual({ available: 0 });
  });

  it('UnauthorizedException → 401 with default message', () => {
    const ex = new UnauthorizedException();
    expect(ex.statusCode).toBe(401);
    expect(ex.code).toBe('UNAUTHORIZED');
    expect(ex.message).toBe('Unauthorized');
  });

  it('ForbiddenException → 403 with custom message', () => {
    const ex = new ForbiddenException('Nope');
    expect(ex.statusCode).toBe(403);
    expect(ex.code).toBe('FORBIDDEN');
    expect(ex.message).toBe('Nope');
  });
});
