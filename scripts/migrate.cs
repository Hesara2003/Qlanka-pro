using System;
using System.IO;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;

namespace MigrationRunner
{
    class Program
    {
        static async Task Main(string[] args)
        {
            try
            {
                string connectionString = "server=localhost;database=queuelanka;user=root;password=password";
                string scriptPath = @"c:\Users\Dell\Desktop\Qlanka-pro\backend\QueueLanka.API\Database\Migrations\004_appointments.sql";
                string script = await File.ReadAllTextAsync(scriptPath);

                await using var conn = new MySqlConnection(connectionString);
                await conn.OpenAsync();
                
                // Allow multiple statements in the command
                await using var cmd = new MySqlCommand(script, conn);
                await cmd.ExecuteNonQueryAsync();
                
                Console.WriteLine("SUCCESS: Migration 004 applied.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
            }
        }
    }
}
