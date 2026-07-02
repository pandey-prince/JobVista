# JobVista

A modern job portal platform connecting job seekers with employers, featuring job listings, applications, and user management.

## Live Demo

[https://job-vista-eta.vercel.app](https://job-vista-eta.vercel.app)

## Tech Stack

**Frontend:**
- React.js
- JavaScript
- Responsive Design
- Modern UI Components

**Backend:**
- Node.js/Express
- RESTful API Architecture
- Database Integration

## Features

- **Job Listings**: Browse and search through available job opportunities
- **User Authentication**: Secure login for job seekers and employers
- **Application Management**: Apply to jobs and track application status
- **Employer Dashboard**: Post and manage job listings
- **Advanced Search**: Filter jobs by location, category, salary, and more
- **Responsive Design**: Seamless experience across all devices

## Project Structure

```
JobVista/
├── backend/              # Backend API server
│   ├── controllers/      # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── middleware/      # Authentication & validation
└── frontend-codes/      # React frontend application
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Application pages
    │   ├── services/    # API integration
    │   └── utils/       # Helper functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB or preferred database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pandey-prince/JobVista.git
cd JobVista
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend-codes
npm install
```

4. Configure environment variables:
   - Create `.env` file in the backend directory
   - Add database connection string, JWT secret, and other configurations

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend-codes
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job (employers only)
- `POST /api/applications` - Apply for a job
- `GET /api/applications/user` - Get user applications

## Deployment

Deployed on Vercel with continuous deployment from the main branch.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
