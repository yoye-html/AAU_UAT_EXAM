# ExamSecure UAT Mock Platform

A Next.js 14 application that simulates the AAU Undergraduate Admission Test (UAT) with a transparent camera proctoring system.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a new project in [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the script in `supabase_setup.sql`.
   - Get your environment variables from Project Settings -> API.

3. **Environment Variables:**
   Create a `.env.local` file in the root with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Architecture Notes
- The camera capture module utilizes `getUserMedia` and runs transparently with explicit consent checkboxes and UI indicators to comply with standard security and privacy policies.
- Uses `sharp` for optimized JPEG compression of frames before they are uploaded to Supabase Storage.
- API endpoints handle score validation and storage interaction securely.

