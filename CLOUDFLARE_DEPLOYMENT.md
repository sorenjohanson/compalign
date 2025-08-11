# Cloudflare Pages Deployment Guide

This guide covers migrating from Netlify to Cloudflare Pages while maintaining Supabase integration.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Supabase Project**: Set up your Supabase project with the required tables
3. **GitHub Repository**: Your code should be in a GitHub repository

## Supabase Database Setup

First, set up your Supabase database with the required tables:

### 1. Create Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Collaboration sessions table
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  host_user_id UUID REFERENCES auth.users(id),
  host_pro_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration participants table
CREATE TABLE collaboration_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255) NOT NULL,
  user_color VARCHAR(7) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_collaboration_sessions_session_id ON collaboration_sessions(session_id);
CREATE INDEX idx_collaboration_participants_session_id ON collaboration_participants(session_id);

-- Enable Row Level Security
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read sessions" ON collaboration_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to create sessions" ON collaboration_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Allow session hosts to update sessions" ON collaboration_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = host_user_id);

CREATE POLICY "Allow authenticated users to read participants" ON collaboration_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to join sessions" ON collaboration_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to leave sessions" ON collaboration_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### 2. Enable Realtime

Enable Realtime for the collaboration tables:

```sql
-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_participants;
```

## Cloudflare Pages Deployment

### 1. Connect Repository to Cloudflare Pages

1. Go to the **Cloudflare Dashboard** → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
   - **Root directory**: `/` (leave empty if project is at root)

### 2. Set Environment Variables

In your Cloudflare Pages project settings, add these environment variables:

**Required for Supabase:**

- `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### 3. Custom Domain (Optional)

1. In Cloudflare Pages → **Custom domains**
2. Add your domain and follow the DNS setup instructions
3. SSL certificates are automatically provisioned

## Local Development

For local development with Supabase:

1. Create a `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

## Deployment Process

### Automatic Deployments

Cloudflare Pages automatically deploys when you push to your main branch:

1. Push changes to your repository
2. Cloudflare Pages detects the changes
3. Builds and deploys automatically
4. Deployment URL is provided

### Manual Deployment

You can also use Wrangler CLI:

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Authenticate:

```bash
wrangler login
```

3. Deploy:

```bash
wrangler pages deploy build
```

## Testing the Deployment

After deployment, test these features:

1. **Basic App**: Verify the salary calculator loads correctly
2. **Authentication**: Test user signup/login if using Supabase Auth
3. **Collaboration**: Test real-time collaboration features
4. **Pro Features**: Verify pro status detection works correctly

## Environment Detection

The app automatically detects the deployment environment:

- **Local Development**: Uses Socket.IO for collaboration (if available)
- **Cloudflare + Supabase**: Uses Supabase Realtime for collaboration
- **Cloudflare Only**: Collaboration features are disabled

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure variables are set in Cloudflare Pages dashboard
   - Variables starting with `VITE_` are exposed to the client

2. **Supabase Connection Issues**
   - Verify your Supabase URL and keys are correct
   - Check that RLS policies allow your operations
   - Ensure Realtime is enabled for collaboration tables

3. **Build Failures**
   - Check build logs in Cloudflare Pages dashboard
   - Ensure all dependencies are properly installed
   - Verify TypeScript compilation passes

4. **CSP Issues with Supabase**
   - The `wrangler.toml` includes `*.supabase.co` in `connect-src`
   - Add your specific Supabase domain if needed

### Debugging

Enable debug logging by setting environment variable:

```bash
DEBUG=collaboration:*
```

## Migration Checklist

- [ ] Update `svelte.config.js` to use `@sveltejs/adapter-cloudflare`
- [ ] Install `@sveltejs/adapter-cloudflare` package
- [ ] Create `wrangler.toml` configuration
- [ ] Set up Supabase database tables
- [ ] Configure environment variables in Cloudflare
- [ ] Test local development with Supabase
- [ ] Deploy to Cloudflare Pages
- [ ] Test production deployment
- [ ] Update DNS settings (if using custom domain)
- [ ] Remove old Netlify configuration files

## Performance Considerations

- **Edge Locations**: Cloudflare Pages serves from 300+ edge locations
- **Supabase Edge Functions**: Consider using for server-side logic
- **Caching**: Static assets are automatically cached
- **Bundle Size**: The dual-mode architecture adds minimal overhead

Your salary calculator is now ready for Cloudflare Pages with full Supabase integration!
