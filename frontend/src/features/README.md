# Feature Modules

Each feature owns reusable presentation components and may depend on shared
types from `src/types`. HTTP services and controllers live outside the
presentation components so the same UI can use Apidog Cloud Mock now and the
real backend later.

```text
features/
├── feed/
│   ├── components/
│   └── index.ts
├── posts/
│   ├── components/
│   └── index.ts
├── comments/
│   ├── components/
│   └── index.ts
└── interactions/
    ├── components/
    └── index.ts

services/
├── api-client.ts
├── feed-service.ts
├── post-service.ts
├── comment-service.ts
└── interaction-service.ts

controllers/
├── feed-controller.ts
└── comment-controller.ts
```

Components receive domain data and callbacks through props. They do not fetch
data or know whether the controller is using the Apidog Cloud Mock or the real
HTTP backend.
