// In a real application, you would use a database.
// This is a mock in-memory store that will be shared across the application in a dev environment.
export const users: any[] = [
    {
      id: "1",
      email: "test@example.com",
      password: "password", // In a real app, this should be a hashed password
    },
  ]; 