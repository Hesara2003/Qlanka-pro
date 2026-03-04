
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace QueueLanka.Shared.Events;

public class InMemoryEventBus : IEventBus
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InMemoryEventBus> _logger;
    private readonly ConcurrentDictionary<Type, List<Type>> _handlers = new();

    public InMemoryEventBus(IServiceProvider serviceProvider, ILogger<InMemoryEventBus> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(TEvent @event) where TEvent : class
    {
        var eventType = typeof(TEvent);
        if (!_handlers.TryGetValue(eventType, out var handlerTypes)) return;

        using var scope = _serviceProvider.CreateScope();
        foreach (var handlerType in handlerTypes)
        {
            try
            {
                var handler = scope.ServiceProvider.GetRequiredService(handlerType);
                var method = handlerType.GetMethod("HandleAsync");
                if (method != null)
                {
                    var task = (Task)method.Invoke(handler, new object[] { @event });
                    await task;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling event {EventType}", eventType.Name);
            }
        }
    }

    public void Subscribe<TEvent, THandler>() where TEvent : class where THandler : IIntegrationEventHandler<TEvent>
    {
        var eventType = typeof(TEvent);
        var handlers = _handlers.GetOrAdd(eventType, _ => new List<Type>());
        if (!handlers.Contains(typeof(THandler)))
        {
            handlers.Add(typeof(THandler));
        }
    }
}

