/**
 * Home Index Page
 * Redirects to welcome screen for anonymous access
 */

import { Redirect } from 'expo-router';

export default function IndexPage() {
  // Redirect to welcome screen for anonymous access
  return <Redirect href="/(auth)/welcome" />;
}
