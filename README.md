# Oasis Social App (Frontend)

This is the frontend for the Oasis Social App, built with Expo (React Native), TypeScript, and Drizzle ORM (SQLite for local data). It connects to the Social Server backend for all social features.

## Features
- Modern social feed (infinite scroll, trending, bookmarks)
- Post creation, likes, comments, reposts
- User profiles, followers, suggestions
- Real-time chat (WIP)
- Settings, privacy, password change
- Dark mode (coming soon)

## Tech Stack
- [Expo](https://expo.dev/) (React Native)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Drizzle ORM](https://orm.drizzle.team/) (SQLite)
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for RN)
- [Cloudinary](https://cloudinary.com/) (image uploads)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Setup
1. Clone the repo:
   ```sh
   git clone <repo-url>
   cd social_app
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Copy and edit `.env`:
   ```sh
   cp .env.example .env
   # Set API base URL, Cloudinary keys, etc.
   ```
4. Start the Expo app:
   ```sh
   npx expo start
   ```
5. Run on device or emulator (iOS/Android/Web)

## Folder Structure
- `app/` - Main screens and navigation
- `components/` - UI components
- `store/` - Redux store and API slices
- `db/` - Local SQLite schema (Drizzle)
- `services/` - API and sync logic
- `assets/` - Images and static assets

## Development
- Use Expo Go or emulators for testing
- Lint with ESLint and Prettier
- Test API with server running locally or remote

## License
MIT
