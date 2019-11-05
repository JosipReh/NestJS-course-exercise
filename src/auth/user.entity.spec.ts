import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

describe('UserEntity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.password = 'testPassword';
    user.salt = 'testSalt';
    bcrypt.hash = jest.fn();
  });

  describe('validatePassword', () => {
    it('returns true if password is valid', async () => {
      bcrypt.hash.mockResolvedValue('testPassword');
      expect(bcrypt.hash).not.toHaveBeenCalled();

      const result = await user.validatePassword('123456');
      expect(bcrypt.hash).toBeCalledWith('123456', 'testSalt');
      expect(result).toEqual(true);
    });

    it('returns false if password is invalid', async () => {
      bcrypt.hash.mockResolvedValue('wrongPassword');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      const result = await user.validatePassword('wrongPassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('wrongPassword', 'testSalt');
      expect(result).toEqual(false);
    });
  });
});
