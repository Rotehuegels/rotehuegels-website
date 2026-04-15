import { redirect } from 'next/navigation';

// Collection requests temporarily disabled — redirect to main e-waste page
export default function EWasteRequestPage() {
  redirect('/ewaste');
}
