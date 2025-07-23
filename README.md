# Budgeter

Budgeter is a personal finance dashboard built with React, TypeScript and Vite. It uses Supabase as the backend to store transactions, accounts, budgets and other financial data. The goal of the project is to provide a simple example of how to combine a modern frontend with Supabase for storing and retrieving finance information.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
   Make sure you are using a recent version of Node.js (18+).

2. **Create an `.env` file** in the project root with your Supabase credentials. A sample configuration is shown below.

3. **Set up the database** by running the SQL provided in `supabase_complete_setup.sql` inside the Supabase SQL editor, or apply the individual files under `supabase/migrations`.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` by default.

5. **Create a production build**
   ```bash
   npm run build
   ```
   The compiled files are generated in the `dist` directory.

## Sample `.env`

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Running the Supabase scripts

- `supabase_complete_setup.sql` – run this file in the Supabase SQL editor to create all tables, indexes, RLS policies and triggers used by the app.
- The `supabase/migrations` folder contains the same SQL broken into smaller migration files if you prefer to run them individually.

Once the database is ready and the `.env` file is configured you can start developing with `npm run dev` or build the project using `npm run build`.

