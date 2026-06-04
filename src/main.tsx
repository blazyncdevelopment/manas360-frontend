import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import App from './App'
import './styles/manas360-design-system.css'
import './index.css'
import { store } from './store'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { VideoSessionProvider } from './context/VideoSessionContext'
import { ErrorProvider } from './components/ErrorProvider'
import { applyThemePreference, getStoredThemePreference } from './lib/themePreference'
import { repairHashBasedRoute } from './lib/hashRouteRedirect'

const forceInitialGoogleTranslateEnglish = () => {
  if (typeof document === 'undefined') return

  const cookieValue = '/en/en'
  const resetFlagKey = 'google-translate-english-reset-once'
  const host = window.location.hostname
  const hostParts = host.split('.').filter(Boolean)
  const candidateDomains = new Set<string>([host, `.${host}`])

  // Clear possible legacy scoped cookies and enforce English.
  for (let i = 0; i < hostParts.length; i += 1) {
    const domain = hostParts.slice(i).join('.')
    candidateDomains.add(domain)
    candidateDomains.add(`.${domain}`)
  }

  document.cookie = `googtrans=${cookieValue}; path=/`
  for (const domain of candidateDomains) {
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain}`
  }

  // Remove URL/hash translation hints that can force non-English on boot.
  if (window.location.hash.includes('googtrans')) {
    const cleanUrl = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', cleanUrl)
  }

  // Remove classes injected by prior Google Translate runs.
  const translatedClassDetected =
    document.documentElement.classList.contains('translated-ltr') ||
    document.documentElement.classList.contains('translated-rtl') ||
    document.body?.classList.contains('translated-ltr') ||
    document.body?.classList.contains('translated-rtl')

  document.documentElement.classList.remove('translated-ltr', 'translated-rtl')
  document.body?.classList.remove('translated-ltr', 'translated-rtl')
  document.documentElement.style.marginTop = '0px'
  if (document.body) {
    document.body.style.top = '0px'
  }

  // If the page already booted in translated mode, force one clean reload in English.

  const hasResetOnce = window.sessionStorage.getItem(resetFlagKey) === 'true'
  if (translatedClassDetected && !hasResetOnce) {
    window.sessionStorage.setItem(resetFlagKey, 'true')
    window.location.replace(`${window.location.pathname}${window.location.search}`)
    return
  }

  if (hasResetOnce) {
    window.sessionStorage.removeItem(resetFlagKey)
  }
}

// PhonePe may return `/#/universal/payment-success` — normalize before React boots.
if (!repairHashBasedRoute()) {
  forceInitialGoogleTranslateEnglish()

  const initialPreference = getStoredThemePreference()
  applyThemePreference(initialPreference)

  // Handle dynamic import/chunk loading failures (common after new deployments)
  if (typeof window !== 'undefined') {
    window.addEventListener('vite:preloadError', (event) => {
      console.warn('Vite preload error detected, forcing hard reload to fetch new assets:', event);
      window.location.reload();
    });
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() === null) {
        applyThemePreference(null)
      }
    }

    if (typeof darkModeQuery.addEventListener === 'function') {
      darkModeQuery.addEventListener('change', handleSystemThemeChange)
    } else if (typeof darkModeQuery.addListener === 'function') {
      darkModeQuery.addListener(handleSystemThemeChange)
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
      <QueryClientProvider client={new QueryClient()}>
        <Provider store={store}>
          <ErrorProvider>
            <ErrorBoundary>
              <VideoSessionProvider>
                <RouterProvider
                  router={createBrowserRouter([
                    // Parent route must accept nested routes — use a trailing /*
                    { path: '/*', element: <App /> },
                  ])}
                  // Opt into v7 behavior to avoid future warnings
                  future={{ v7_startTransition: true }}
                />
              </VideoSessionProvider>
            </ErrorBoundary>
          </ErrorProvider>
        </Provider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
