# GlocalCart API Microservice Readiness

This API is still deployed as one process, but the startup and user-facing HTTP layer are organized so bounded contexts can be extracted with less risk.

## Bounded contexts

- Identity Access: authentication, users, JWT, Identity roles.
- Catalog: products, categories, reviews, media uploads.
- Shopping: cart, favorite products, followed shops.
- Ordering: orders, payments, auto-cancel background worker.
- Fulfillment: shipper workflow, shipments, delivery realtime.
- Communication: notifications, chat, SignalR hubs.
- Operations: admin and development tools.

## Current extraction status

- `Program.cs` is only the composition root.
- Infrastructure setup is isolated in `Extensions/`.
- Database migration and seed flow is isolated in `Data/DatabaseInitializer.cs`.
- `AdminController`, `ChatController`, `FavoritesController`, and `ShopsController` no longer query `AppDbContext` directly.
- `/health` is available for container and service health checks.
- `Dockerfile` lets the API be built and deployed as an independent service container.

## Next extraction order

1. Move Communication into a standalone service first because chat and notifications already have clear APIs and hub endpoints.
2. Move Catalog next because product read APIs are high-volume and mostly independent.
3. Split Ordering, Payment, and Fulfillment only after introducing integration events or a message bus.
4. Keep Identity Access centralized until all services validate JWT consistently.

## Rules for future changes

- Controllers should depend on service interfaces, not `AppDbContext`.
- Cross-context changes should happen through application services first, then through events when the service is extracted.
- New externally visible contracts should use DTOs under `DTOs/<Context>`.
- Do not add more startup code directly to `Program.cs`; place it in `Extensions/` or an initializer.
