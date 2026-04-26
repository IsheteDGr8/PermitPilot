import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'PermitPilot — Agentic AI-Powered Civic Permit Navigator' },
      { name: 'description', content: 'From 14 Weeks to 14 Minutes. Navigate city permits with AI-powered multi-agent evaluation.' },
    ],
  }),
})

function RootLayout() {
  return <Outlet />
}
