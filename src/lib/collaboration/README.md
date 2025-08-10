# Dual-Mode Collaboration System

This collaboration system supports both **local development** (Socket.IO) and **hosted production** (Supabase Realtime) modes.

## Architecture

- **Provider Interface**: Abstracts collaboration functionality
- **Socket.IO Provider**: For local development and self-hosted deployments
- **Supabase Provider**: For hosted/managed deployments
- **Auto-Detection**: Automatically chooses the right provider based on configuration

## Configuration

### Local/OSS Mode (Socket.IO)

```env
# .env.local
VITE_COLLABORATION_MODE=local
```

This uses the Socket.IO server for real-time collaboration.

### Hosted Mode (Supabase)

```env
# .env.production
VITE_COLLABORATION_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Disabled Mode

```env
# .env
VITE_COLLABORATION_MODE=disabled
```

## Setup Instructions

### For Local Development

1. Set `VITE_COLLABORATION_MODE=local` in your `.env.local`
2. Run CompAlign with Socket.IO server enabled
3. Collaboration features will work locally using in-memory storage

### For Supabase Hosting

1. Create a Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Get your project URL and anon key from Supabase dashboard
4. Set environment variables:
   ```env
   VITE_COLLABORATION_MODE=supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Deploy CompAlign

## Features

### Shared Between Modes

- Real-time field updates
- User presence indicators
- Typing indicators
- Session management
- Pro status sharing

### Socket.IO Mode (Local)

- In-memory session storage
- Automatic cleanup on server restart
- Suitable for development and small deployments

### Supabase Mode (Hosted)

- Persistent session storage in PostgreSQL
- Automatic session cleanup via database functions
- Global real-time sync via Supabase edge network
- Row-level security
- Scales automatically

## Usage

The collaboration system automatically detects and uses the appropriate provider. No code changes needed when switching between modes.

```typescript
import { initializeCollaboration, joinSession } from '$lib/stores/collaboration';

// Initialize (auto-detects provider)
initializeCollaboration();

// Join a session (works with both providers)
await joinSession('session-123', { name: 'User' }, true);
```
