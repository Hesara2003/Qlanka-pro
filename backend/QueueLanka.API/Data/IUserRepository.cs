using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int userId);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<int> CreateAsync(User user);
    Task SetEmailVerifiedAsync(int userId);
}
