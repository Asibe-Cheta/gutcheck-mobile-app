/**
 * Legacy upgrade route. Plans, prices and trials live on the subscription screen, which reads
 * them from the store; this route only forwards there so no stale price can be shown.
 */

import { Redirect } from 'expo-router';

export default function UpgradeScreen() {
  return <Redirect href="/subscription" />;
}
