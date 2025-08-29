# Docker Setup for Tzafrir Shuttle System

## Overview
This Docker setup provides a complete containerized environment for the Tzafrir Shuttle System with three main components:
- **Frontend**: React 18 application with Vite
- **Backend**: Node.js Express API server
- **Database**: PostgreSQL 15

## Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB of free RAM
- Ports 5173, 3001, and 5432 available

## Quick Start

### 1. Create Environment File
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your configuration
notepad .env
```

### 2. Build and Run Containers
```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

### 4. Default Admin Credentials
```
Email: admin@tzafrir.com
Password: admin123
```
⚠️ **IMPORTANT**: Change these credentials immediately in production!

## Docker Commands

### Basic Operations
```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Rebuild containers
docker-compose build

# View container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Service-Specific Commands
```bash
# Restart specific service
docker-compose restart frontend
docker-compose restart backend
docker-compose restart postgres

# Execute commands in container
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle

# Backup database
docker-compose exec postgres pg_dump -U postgres tzafrir_shuttle > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d tzafrir_shuttle < backup.sql
```

## Development Workflow

### Frontend Development
The frontend container runs in development mode with hot-reload enabled:
```bash
# View frontend logs
docker-compose logs -f frontend

# Rebuild frontend after package changes
docker-compose build frontend
docker-compose restart frontend
```

### Backend Development
The backend uses nodemon for automatic restarts:
```bash
# View backend logs
docker-compose logs -f backend

# Install new npm packages
docker-compose exec backend npm install package-name

# Run database migrations
docker-compose exec backend npm run migrate
```

### Database Development
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle

# Run SQL commands
\dt                    # List all tables
\d table_name         # Describe table structure
\q                    # Exit
```

## Production Deployment

### 1. Build Production Images
```bash
# Build with production target
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### 2. Environment Variables
Update `.env` with production values:
- Strong JWT_SECRET
- Production database credentials
- Proper CORS origins
- SSL certificates (if applicable)

### 3. Security Checklist
- [ ] Change default admin password
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable monitoring and logging
- [ ] Use secrets management
- [ ] Implement rate limiting

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Reset everything
docker-compose down -v
docker-compose up --build
```

### Database Connection Issues
```bash
# Check if database is ready
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up -d backend frontend
```

### Port Already in Use
```bash
# Find process using port (Windows)
netstat -ano | findstr :5173
taskkill /PID [process-id] /F

# Or change ports in docker-compose.yml
ports:
  - "5174:5173"  # Changed from 5173
```

### Permission Issues
```bash
# Fix volume permissions
docker-compose exec backend chown -R node:node /app
docker-compose exec postgres chown -R postgres:postgres /var/lib/postgresql/data
```

## Volumes and Data Persistence

### Database Volume
PostgreSQL data is persisted in a Docker volume:
```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm -v tzafrir-shuttle_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v tzafrir-shuttle_postgres_data:/data -v ${PWD}:/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

### Application Volumes
Source code is mounted for development:
- `./frontend:/app` - Frontend source
- `./backend:/app` - Backend source

## Monitoring

### Container Statistics
```bash
# Real-time stats
docker stats

# Check resource usage
docker-compose top
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Database health
docker-compose exec postgres pg_isready
```

## Cleanup

### Remove Everything
```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes (database data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

### Prune System
```bash
# Remove unused containers, networks, images
docker system prune -a

# Also remove volumes
docker system prune -a --volumes
```

## Migration from Supabase

To migrate from existing Supabase:

1. Export data from Supabase:
```sql
-- In Supabase SQL editor
COPY companies TO '/tmp/companies.csv' CSV HEADER;
COPY shuttles TO '/tmp/shuttles.csv' CSV HEADER;
COPY shuttle_schedules TO '/tmp/schedules.csv' CSV HEADER;
```

2. Import to Docker PostgreSQL:
```bash
# Copy files to container
docker cp companies.csv tzafrir-db:/tmp/
docker cp shuttles.csv tzafrir-db:/tmp/
docker cp schedules.csv tzafrir-db:/tmp/

# Import data
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle -c "\COPY companies FROM '/tmp/companies.csv' CSV HEADER"
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle -c "\COPY shuttles FROM '/tmp/shuttles.csv' CSV HEADER"
docker-compose exec postgres psql -U postgres -d tzafrir_shuttle -c "\COPY shuttle_schedules FROM '/tmp/schedules.csv' CSV HEADER"
```

## Support

For issues or questions:
1. Check container logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Ensure Docker Desktop is running
4. Check available disk space and memory