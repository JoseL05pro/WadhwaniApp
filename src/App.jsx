import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import Inventario from './Inventario'
import SketchVoiceAssistant from './components/SketchVoiceAssistant'

function App() {
  const [user, setUser]       = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [page, setPage]         = useState('dashboard')

  if (!loggedIn) {
    return <Login onLogin={(u) => { setUser(u); setLoggedIn(true) }} />
  }

  return (
    <>
      {page === 'dashboard'  && <Dashboard  onNavigate={setPage} user={user} />}
      {page === 'inventario' && <Inventario onNavigate={setPage} user={user} />}
      <SketchVoiceAssistant />
    </>
  )
}

export default App