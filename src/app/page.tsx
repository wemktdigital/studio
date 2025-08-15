import { redirect } from 'next/navigation';

export default function Home() {
  // TODO: Replace with logic to redirect to the last visited or default workspace/channel
  redirect('/w/1/c/1');
  return null;
}
