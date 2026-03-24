import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import stylesheet from "./tailwind.css?url";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="840077380859-safpk8a1nq24i146d98bjvp0vbv927j6.apps.googleusercontent.com">
      <Outlet />
    </GoogleOAuthProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // Handle "Failed to fetch" or network-related errors gracefully
  const isNetworkError =
    error instanceof TypeError && (error.message.includes("Failed to fetch") || error.message.includes("Network Error")) ||
    (typeof error === "string" && (error.includes("Failed to fetch") || error.includes("Network Error")));

  if (isNetworkError) {
    return (
      <html lang="en">
        <head>
          <title>Offline - Network Error</title>
          <Meta />
          <Links />
        </head>
        <body className="antialiased bg-gray-50 flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Lost</h1>
            <p className="text-gray-600 mb-6">
              It seems you are offline or we couldn't connect to the server. Please check your internet connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  // Handle standard HTTP route errors (e.g., 404)
  if (isRouteErrorResponse(error)) {
    return (
      <html lang="en">
        <head>
          <title>{error.status} - {error.statusText}</title>
          <Meta />
          <Links />
        </head>
        <body className="antialiased bg-gray-50 flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error.status} {error.statusText}</h1>
            <p className="text-gray-600 mb-6">
              {error.data?.message || "Something went wrong loading this page."}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Go Back
            </button>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  // Fallback for any other type of error
  return (
    <html lang="en">
      <head>
        <title>Application Error</title>
        <Meta />
        <Links />
      </head>
      <body className="antialiased bg-gray-50 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
          <p className="text-gray-600 mb-4">
            An unexpected error has occurred. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Go to Homepage
          </button>
        </div>
        <Scripts />
      </body>
    </html>
  );
}