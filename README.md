# AI Doctor

This is a web application that uses Google's Gemini models to answer medical questions based on text and images.

It is built with [Next.js](https://nextjs.org/) and uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Features

-   User authentication (Sign up, Login)
-   User profile management (Update email, first name, and password)
-   Admin dashboard with user and plans management
-   Subscription plans (Free, Basic, Premium) with feature management
-   Chat interface for interacting with the AI
-   Support for text and image-based questions
-   Real-time responses from the AI
-   Disclaimer for medical information
-   **Persistent Data Storage**: User accounts, plans, and settings persist between server restarts

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **AI**: [Google Vertex AI (Gemini)](https://cloud.google.com/vertex-ai)
-   **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Next, create a `.env.local` file in the root of the project with the following variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET= # Generate a secret: `openssl rand -hex 32`
GCP_PROJECT_ID= # Your Google Cloud Project ID
GCP_LOCATION= # e.g., us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON= # Your service account key JSON content
```

### Google Cloud Setup

To use the Gemini model, you will need to:

1.  Create a Google Cloud Platform project.
2.  Enable the Vertex AI API.
3.  Create a service account with the "Vertex AI User" role.
4.  Download the JSON key for the service account.
5.  Populate the `GCP_PROJECT_ID`, `GCP_LOCATION`, and `GOOGLE_APPLICATION_CREDENTIALS_JSON` variables in your `.env.local` file.

Then, initialize the data storage (creates default users, plans, and settings):

```bash
npm run init-data
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Admin Access

To access the admin dashboard:

1. Login with the admin account:
   - Email: `admin@example.com`
   - Password: `admin123`

2. Click the "Admin Panel" button in the dashboard header

3. Manage users and subscription plans from the admin interface

### Test Accounts

- **Regular User**: `test@example.com` / `password`
- **Admin User**: `admin@example.com` / `admin123` 