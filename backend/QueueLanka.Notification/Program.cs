using QueueLanka.Shared.Events;
using QueueLanka.Notification.Services;
using QueueLanka.Notification.Handlers;

var builder = Host.CreateApplicationBuilder(args);

// Register services
builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
builder.Services.AddSingleton<INotificationService, NotificationService>();

// Register Event Bus (using the simple InMemoryEventBus for MVP)
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();

// Register Event Handlers
builder.Services.AddTransient<UserRegisteredEventHandler>();
builder.Services.AddTransient<BookingConfirmedEventHandler>();
builder.Services.AddTransient<TokenCancelledEventHandler>();

var host = builder.Build();

// Subscribe to events
var eventBus = host.Services.GetRequiredService<IEventBus>();
eventBus.Subscribe<UserRegisteredEvent, UserRegisteredEventHandler>();
eventBus.Subscribe<BookingConfirmedEvent, BookingConfirmedEventHandler>();
eventBus.Subscribe<TokenCancelledEvent, TokenCancelledEventHandler>();

await host.RunAsync();
