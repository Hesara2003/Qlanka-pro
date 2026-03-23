
using System;
using System.Threading.Tasks;

namespace QueueLanka.Shared.Events;

public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent @event) where TEvent : class;
    void Subscribe<TEvent, THandler>() where TEvent : class where THandler : IIntegrationEventHandler<TEvent>;
}

public interface IIntegrationEventHandler<in TEvent> where TEvent : class
{
    Task HandleAsync(TEvent @event);
}

