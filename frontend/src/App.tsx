import { Routes, Route } from 'react-router-dom'
import Canvas from './pages/Canvas'
import Decalcomania from './pages/Decalcomania'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/canvas" element={<Canvas />} />
      <Route path="/canvas/:id" element={<Canvas />} />
      <Route path="/decalcomania" element={<Decalcomania />} />
      <Route path="/decalcomania/:id" element={<Decalcomania />} />
      <Route path="/gallery" element={<div>Gallery</div>} />
      <Route path="/explore" element={<div>Explore</div>} />
      <Route path="/artwork/:id" element={<div>Artwork Detail</div>} />
      <Route path="/user/:id" element={<div>User Profile</div>} />
      <Route path="/search" element={<div>Search</div>} />
      <Route path="/notifications" element={<div>Notifications</div>} />
      <Route path="/pricing" element={<div>Pricing</div>} />
      <Route path="/billing" element={<div>Billing</div>} />
      <Route path="/profile" element={<div>Profile</div>} />
      <Route path="/contact" element={<div>Contact</div>} />
      <Route path="/password-reset" element={<div>Password Reset</div>} />
      <Route path="/payment/success" element={<div>Payment Success</div>} />
      <Route path="/payment/fail" element={<div>Payment Fail</div>} />
      <Route path="/terms" element={<div>Terms</div>} />
      <Route path="/privacy" element={<div>Privacy</div>} />
      <Route path="/admin" element={<div>Admin</div>} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  )
}

export default App
