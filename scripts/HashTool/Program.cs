using System; class Program { static void Main() { string hash = BCrypt.Net.BCrypt.HashPassword("Admin123!"); Console.WriteLine(hash); } }
