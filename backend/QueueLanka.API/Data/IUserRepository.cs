using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<int> CreateAsync(User user);
    Task SetEmailVerifiedAsync(int userId);
    Task UpdatePasswordAsync(int userId, string newPasswordHash);
}
