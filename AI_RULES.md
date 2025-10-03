# AI Rules for Beauty Salon Management App

## Tech Stack

- **React 18.3.1** - Frontend framework for building user interfaces
- **TypeScript** - Static type checking for JavaScript development
- **Supabase** - Backend-as-a-Service for authentication, database, and real-time features
- **Tailwind CSS** - Utility-first CSS framework for styling
- **FullCalendar** - Calendar component for scheduling and agenda views
- **Lucide React** - Icon library for consistent UI icons
- **QRCode.react** - QR code generation component
- **Vite** - Build tool and development server for fast React applications

## Library Usage Rules

### Authentication & Database
- **Always use Supabase** for all authentication, database operations, and real-time features
- **Never use localStorage or sessionStorage** for user data or authentication state
- **Always use the AuthContext** for authentication state management
- **Database operations** should be centralized in the `src/lib/supabase.ts` file

### UI Components
- **Always use Tailwind CSS** for all styling - no custom CSS files
- **Use shadcn/ui components** when available for consistent design patterns
- **Use Lucide React icons** for all icons - no other icon libraries
- **Create reusable components** in `src/components/` for common UI patterns
- **Follow the existing component structure** - functional components with TypeScript props

### Forms & Modals
- **Always use controlled components** for form inputs
- **Implement proper form validation** with error states
- **Use modals** for forms that need to be triggered from different pages
- **Keep modals simple** - one purpose per modal component

### Data Fetching
- **Always use React hooks** (useState, useEffect) for data fetching
- **Implement proper loading states** for all async operations
- **Handle errors gracefully** with user-friendly error messages
- **Use TypeScript interfaces** for all data structures

### Routing
- **Keep all routes in src/App.tsx** - no separate routing files
- **Use React Router** for client-side navigation
- **Implement route protection** based on user roles (admin/professional)
- **Always handle loading states** during route transitions

### State Management
- **Use React Context** for global state (like authentication)
- **Use local state** (useState) for component-specific state
- **Avoid prop drilling** - use context or lift state up when necessary
- **Keep state as close to where it's used as possible

### Calendar & Scheduling
- **Always use FullCalendar** for all calendar/agenda views
- **Implement proper event handling** for calendar interactions
- **Use Portuguese locale** (`ptBrLocale`) for all calendar displays
- **Keep calendar data in sync** with the database

### File Structure
- **Pages go in `src/pages/`** - one component per route
- **Components go in `src/components/`** - reusable UI elements
- **Contexts go in `src/contexts/`** - global state management
- **Utilities go in `src/lib/`** - database connections and helpers
- **Types go in `src/lib/supabase.ts`** - TypeScript interfaces

### Code Quality
- **Always use TypeScript** - no JavaScript files
- **Follow ESLint rules** - no unused variables, proper imports
- **Write clean, readable code** - meaningful variable names and comments
- **Implement proper error handling** - don't let errors crash the app
- **Test thoroughly** - especially forms and data operations

### Performance
- **Use React.memo** for expensive components that don't change often
- **Implement proper cleanup** in useEffect hooks
- **Avoid unnecessary re-renders** - use useCallback and useMemo when appropriate
- **Optimize database queries** - select only needed fields

### Security
- **Never expose API keys** in client-side code
- **Always validate user input** on both client and server
- **Use Supabase Row Level Security** for database permissions
- **Implement proper role-based access control** in the frontend