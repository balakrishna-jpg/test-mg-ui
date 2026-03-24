
// app/routes/_index.tsx
import { redirect, type LoaderFunction } from "@remix-run/cloudflare";
import { getUser, getUserLandingRoute } from "~/utils/session";  // Importing the session functions
import LandingPage from "~/components/ElectionsWeb/website/landingPage";

export const loader: LoaderFunction = async ({ request }) => {
  // Fetch the logged-in user's data from the API
  const user = await getUser(request); // This will check the session or token

  // If the user is logged in, redirect them to their appropriate dashboard
  if (user) {
    const route = getUserLandingRoute(user);
    if (route) return redirect(route);
  }

  // If not logged in, just remain on the page (return null/empty response)
  return null;
};

export default function Index() {
  return <LandingPage />;
}
