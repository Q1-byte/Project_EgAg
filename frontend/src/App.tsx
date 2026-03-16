import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/login" element={<div>Login</div>} />
      <Route path="/signup" element={<div>Signup</div>} />
      <Route path="/canvas" element={<div>Canvas</div>} />
      <Route path="/canvas/:id" element={<div>Canvas Continue</div>} />
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
