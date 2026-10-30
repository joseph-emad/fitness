# Fitness

Fitness is a local-development project with a React/Vite frontend and Spring Boot services for the API gateway, users, activities, AI recommendations, service discovery, and configuration.

## Run the complete local stack

Requirements: Docker Desktop with Compose support. The first run builds the Java and frontend images and downloads the backing service images.

1. Copy `.env.example` to `.env` and change the sample passwords if you want different local credentials. `.env` is ignored by Git.
2. From the repository root, run `docker compose up --build`.
3. Open the frontend at <http://localhost:5173>. Sign up or log in using the local Keycloak realm.

The local endpoints are:

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API gateway | <http://localhost:8080> |
| Keycloak admin | <http://localhost:8181> |
| Eureka dashboard | <http://localhost:8761> |
| RabbitMQ management | <http://localhost:15672> |

The Keycloak realm and PKCE client are imported from `keycloak/fitness-oauth2-realm.json`. Realm registration is enabled for local development. The default Keycloak administrator is configured by `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD`.

AI recommendations require a Gemini API key. Set `GEMINI_API_KEY` in `.env` to enable calls to Gemini; the rest of the stack can start without it.

The activity log supports running, walking, cycling, swimming, weight training, yoga, HIIT, cardio, stretching, and other activities. Weight-training sessions can include multiple exercises, each with a set count, reps per set, weight in kilograms, and rest time in seconds.

Activity creation stores the activity and its RabbitMQ event in a MongoDB transactional outbox. The local MongoDB container is initialized as a single-node replica set for this transaction. The outbox retries failed publishes and uses RabbitMQ publisher confirms; after ten unsuccessful attempts an event is marked `FAILED` for operator review. Delivery is at least once, and the AI consumer is idempotent by activity ID. Any standalone activity-service environment must also use MongoDB configured as a replica set and include its replica set name in `ACTIVITY_MONGODB_URI`.

Use `docker compose down` to stop the services. Compose keeps PostgreSQL and MongoDB data in named volumes. To intentionally remove local database data as well, run `docker compose down --volumes`.

## Build and checks without Docker

Build and test all backend services from the repository root with `mvn verify`. In `fitness-app-frontend`, run `npm ci`, `npm run test`, `npm run lint`, and `npm run build`.

When running services outside Compose, configure local MongoDB, PostgreSQL, RabbitMQ, Keycloak, and the Config Server as described in `.env.example`; the default standalone URLs target `localhost`.

## Scope

Compose is a developer convenience, not a production deployment definition. Do not reuse its local credentials or `start-dev` Keycloak settings in a deployed environment.
