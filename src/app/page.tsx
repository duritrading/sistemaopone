// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redireciona para a aba Equipe (primeira que vamos desenvolver)
  redirect('/equipe')
}