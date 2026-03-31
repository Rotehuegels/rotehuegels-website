'use client';

import { useRouter } from 'next/navigation';
import BankUploader from './BankUploader';

export default function BankImportPanel() {
  const router = useRouter();
  return <BankUploader onSuccess={() => router.refresh()} />;
}
