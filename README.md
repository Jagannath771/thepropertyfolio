# ThePropertyFolio

<div align="center">

**A production-ready, full-stack property management platform** for tenants and property owners — built with Next.js 14, FastAPI, PostgreSQL, and an AI-powered concierge chatbot.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)

</div>

---

## ✨ Features

| Category | Capabilities |
|---|---|
| 🏠 **Property Listings** | Browse, filter, and search with real-time Mapbox integration |
| 👤 **Tenant Portal** | Apply for properties, track applications, pay rent, submit maintenance requests |
| 🏢 **Owner Dashboard** | List properties, review applications, track financials, manage maintenance |
| 🤖 **AI Chatbot** | GPT-4o powered concierge with streaming responses (SSE) on every page |
| 🔐 **Secure Auth** | NextAuth v5 + JWT + bcrypt + TOTP 2FA for owner accounts |
| 📧 **Transactional Email** | Automated emails via Resend API (applications, maintenance, payments) |
| 📁 **File Storage** | Property images & documents stored in AWS S3 |
| 📱 **Fully Responsive** | Optimised from 320px mobile to 2560px widescreen |
| ⚡ **Production-Ready** | Docker, Nginx, GitHub Actions CI/CD, 80%+ test coverage |

---

## 🛠 Tech Stack

**Frontend**
- [Next.js 14](https://nextjs.org) (App Router, Server Components)
- TypeScript · TailwindCSS · Zustand · NextAuth v5

**Backend**
- [FastAPI](https://fastapi.tiangolo.com) · Python 3.12
- SQLAlchemy (async) · Alembic · Pydantic v2
- Celery + Redis (background tasks)

**Infrastructure**
- PostgreSQL 16 · Redis · AWS S3
- Docker + Docker Compose · Nginx reverse proxy
- GitHub Actions CI/CD

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| [Docker](https://docs.docker.com/get-docker/) | 24+ |
| [Docker Compose](https://docs.docker.com/compose/install/) | 2.20+ |
| [Node.js](https://nodejs.org) | 20+ |
| [Python](https://python.org) | 3.12+ |
| [Make](https://www.gnu.org/software/make/) | Any |

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/thepropertyfolio.git
cd thepropertyfolio

# Copy environment template
cp .env.example .env
```

### 2. Fill in Environment Variables

Edit `.env` and add your API keys. The app runs without most keys — affected features fall back gracefully.

| Variable | Purpose | Where to get it |
|---|---|---|
| `OPENAI_API_KEY` | AI chatbot | [platform.openai.com](https://platform.openai.com) |
| `RESEND_API_KEY` | Transactional email | [resend.com](https://resend.com) |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth sign-in | [console.cloud.google.com](https://console.cloud.google.com) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Property maps | [account.mapbox.com](https://account.mapbox.com) |
| `NEXTAUTH_SECRET` | Session encryption | `openssl rand -hex 32` |
| `SECRET_KEY` | JWT signing | `openssl rand -hex 32` |
| `FIELD_ENCRYPTION_KEY` | SSN/Gov ID encryption (AES-256-GCM) | `python -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"` |
| `AWS_ACCESS_KEY_ID/SECRET` | File uploads | [AWS IAM Console](https://console.aws.amazon.com/iam) |
| `STRIPE_SECRET_KEY` | Payments | [dashboard.stripe.com](https://dashboard.stripe.com) |

### 3. Start Development

```bash
make dev
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Nginx** | http://localhost:80 |

### 4. Apply Database Migrations

```bash
make migrate
```

### 5. Seed Sample Data

```bash
make seed
```

---

## 🧪 Testing

```bash
make test           # Run all test suites

make test-unit      # pytest — unit tests
make test-api       # pytest — API integration tests
make coverage       # pytest + HTML coverage report
make test-e2e       # Playwright — end-to-end browser tests
make test-robot     # Robot Framework — acceptance tests
```

Coverage report opens at `backend/htmlcov/index.html`.

---

## 🔧 Code Quality

```bash
make lint           # Ruff + Pylint + ESLint
make format         # Black + Prettier (auto-fix)
make typecheck      # mypy + tsc
```

---

## 🗄️ Database Management

```bash
make migrate                          # Apply all pending migrations
make migrate-new msg="add feature"    # Create a new migration
make migrate-down                     # Roll back one migration
make shell-db                         # Open psql shell
```

---

## 📁 Project Structure

```
thepropertyfolio/
├── frontend/                  # Next.js 14 App Router
│   ├── app/                   # Pages + API routes
│   │   ├── (public)/          # Public-facing pages
│   │   ├── (tenant)/          # Tenant portal
│   │   └── (owner)/           # Owner dashboard
│   ├── components/            # Shared UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Auth, API client, SEO helpers
│   └── tests/e2e/             # Playwright E2E tests
│
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic v2 schemas
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # Auth, logging, rate limiting
│   │   └── workers/           # Celery background tasks
│   ├── alembic/               # Database migrations
│   └── tests/                 # pytest + Robot Framework
│
├── nginx/                     # Reverse proxy configuration
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose.yml         # Development orchestration
├── docker-compose.prod.yml    # Production orchestration
├── Makefile                   # Dev workflow shortcuts
└── .env.example               # Environment variable template
```

---

## 🌐 API Reference

Full interactive docs available at `http://localhost:8000/docs` when the backend is running.

**Key Endpoints**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create tenant or owner account |
| `POST` | `/api/auth/login` | Login + receive JWT tokens |
| `GET` | `/api/properties` | List properties with filters |
| `POST` | `/api/applications` | Submit tenant application |
| `POST` | `/api/chat` | Streaming AI chatbot (SSE) |
| `POST` | `/api/contact` | Submit a contact enquiry |
| `GET` | `/api/maintenance` | List maintenance requests |

---

## 🔐 Security

- Passwords hashed with **bcrypt** (cost factor 12)
- SSN & Gov ID encrypted at rest with **AES-256-GCM**
- **JWT** access tokens (15 min) + refresh tokens (7 days) with rotation
- Owner accounts require **TOTP 2FA**
- **Rate limiting** on all endpoints via slowapi
- **CORS** restricted to known origins
- Full security headers via Nginx (HSTS, CSP, X-Frame-Options, X-Content-Type)

---

## 🚢 Deployment

See [`docker-compose.prod.yml`](docker-compose.prod.yml) and [`.env.production`](.env.production) for production configuration.

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations in production
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please run `make lint` and `make test` before submitting.

---

## 📄 License

[MIT](LICENSE) — © 2026 Jagannath Sai Kasarabada
