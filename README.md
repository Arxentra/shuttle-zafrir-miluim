# Tzafrir Shuttle System

A modern shuttle management system built with FastAPI (Python) backend and React frontend, deployed with Docker.

## 🚀 Quick Start

### Run Everything with One Command
```bash
npm start
```
This will start:
- ✅ FastAPI Backend (Python) on port 3001
- ✅ React Frontend on port 5173  
- ✅ PostgreSQL Database on port 5432
- ✅ Nginx Proxy on port 8080 (main entry point)

### Access the Application
- **Main App**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs
- **API Health**: http://localhost:8080/health

## 🛠️ Available Commands

### Development
```bash
npm start          # Start all services (detached mode)
npm run dev        # Start all services (with logs)
npm stop           # Stop all services
npm run restart    # Restart all services
npm run status     # Check container status
```

### Logs & Monitoring
```bash
npm run logs              # View all logs
npm run logs:backend      # Backend logs only
npm run logs:frontend     # Frontend logs only
```

### Individual Services
```bash
npm run backend    # Start backend + database only
npm run frontend   # Start frontend only
```

### Maintenance
```bash
npm run build      # Build all containers from scratch
npm run clean      # Stop and remove all containers/volumes
npm run db:reset   # Reset database (WARNING: deletes data)
```

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with AsyncPG + SQLAlchemy
- **Authentication**: JWT tokens with bcrypt
- **API Documentation**: Auto-generated Swagger/OpenAPI
- **Monitoring**: OpenTelemetry + structured logging
- **Features**: CSV import/export, WebSocket support, bulk operations

### Frontend (React + TypeScript)
- **Framework**: React with Vite
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + Context
- **Build Tool**: Vite with hot reload

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with security headers
- **Database**: PostgreSQL 15 with health checks
- **Networking**: Docker bridge network

## 🔧 Environment Configuration

Copy `.env.example` to `.env` in both backend and root directories:

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/tzafrir_shuttle
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/register` - Register admin user

### Core Resources
- `GET/POST/PUT/DELETE /api/companies` - Company management
- `GET/POST/PUT/DELETE /api/shuttles` - Shuttle management  
- `GET/POST/PUT/DELETE /api/schedules` - Schedule management
- `GET/POST/PUT/DELETE /api/registrations` - Registration management

### Admin & Analytics
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - User management

### Data Management
- `POST /api/csv/import-registrations` - Import registrations from CSV
- `GET /api/csv/export-registrations` - Export registrations to CSV
- `PUT /api/csv/bulk-update-schedules` - Bulk update schedules

### Real-time
- `WebSocket /ws` - Real-time updates

## 🐳 Docker Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| Frontend | tzafrir-frontend | 5173 | React dev server |
| Backend | tzafrir-backend | 3001 | FastAPI server |
| Database | tzafrir-db | 5432 | PostgreSQL 15 |
| Proxy | tzafrir-proxy | 8080 | Nginx reverse proxy |

## 🔒 Security Features

- JWT authentication with secure headers
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention with parameterized queries
- Security headers via Nginx
- Input validation with Pydantic

## 📈 Monitoring & Logging

- OpenTelemetry tracing for performance monitoring
- Structured JSON logging
- Request/response logging
- Database connection health checks
- Container health monitoring

## 🚀 Production Deployment

For production deployment, use:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Remember to:
1. Change default passwords and secrets
2. Use proper SSL certificates
3. Configure production database
4. Set appropriate environment variables
5. Enable proper logging and monitoring

## 🤝 Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Development  
```bash
cd frontend
npm install
npm run dev
```

### Database Management
The database is automatically initialized with the schema from `database/init/01-init.sql`.

Default admin credentials:
- Email: `admin@tzafrir.com`
- Password: `admin123`

**⚠️ Change these in production!**