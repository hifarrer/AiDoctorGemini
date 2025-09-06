# Health Consultant AI

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

### Data Files Setup

**IMPORTANT**: Before running the application, you need to set up the data files:

1. Copy the sample files to create your actual data files:
   ```bash
   cp data/users.sample.json data/users.json
   cp data/settings.sample.json data/settings.json
   cp data/plans.sample.json data/plans.json
   cp data/usage.sample.json data/usage.json
   ```

2. Set your admin password:
   - Open `data/users.json`
   - Find the admin user in the database and set `is_admin = true` as needed
   - Change the password from "CHANGE_THIS_PASSWORD" to a secure password

3. Configure Stripe settings (if using subscriptions):
   - Open `data/settings.json`
   - Add your Stripe secret key, publishable key, and webhook secret
   - Add your Stripe price IDs for Basic and Premium plans

### Admin Access

To access the admin dashboard:

1. Login with the admin account:
   - Create an admin user in the DB and set `is_admin = true`
   - Password: (the password you set in data/users.json)

2. Click the "Admin Panel" button in the dashboard header

3. Manage users and subscription plans from the admin interface

### Test Accounts

- **Regular User**: `test@example.com` / `password`
- **Admin User**: Use any email; set `is_admin = true` in the `users` table

### Important Notes

- **Data files are NOT tracked by git** to protect user privacy and prevent data loss during deployments
- User data and admin credentials will persist between server restarts but not between deployments
- After each deployment, you'll need to set up the admin password and Stripe settings again
- For production use, consider migrating to a proper database solution 