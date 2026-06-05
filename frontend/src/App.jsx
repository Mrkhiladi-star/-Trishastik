import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Page imports
import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import Education from "./pages/Education";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import Customers from "./pages/Customers";
import Profile from "./pages/Profile";
import SoilTest from "./pages/SoilTest";
import SellerDashboard from "./pages/SellerDashboard";
import TransporterDashboard from "./pages/TransporterDashboard";

// Form creation imports
import NewListing from "./pages/NewListing";
import NewBlog from "./pages/NewBlog";
import NewEducation from "./pages/NewEducation";
import NewReview from "./pages/NewReview";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6">
            <Navbar />
            <main className="mt-4">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/education" element={<Education />} />

                {/* Authenticated Routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/shop" 
                  element={
                    <ProtectedRoute nonAdminOnly={true}>
                      <Shop />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/newreview" 
                  element={
                    <ProtectedRoute nonAdminOnly={true}>
                      <NewReview />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/soil-test" 
                  element={
                    <ProtectedRoute>
                      <SoilTest />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/seller-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={["admin", "farmer", "fertilizer_seller", "instrument_seller"]}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/transporter-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={["admin", "transporter"]}>
                      <TransporterDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Only Routes */}
                <Route 
                  path="/customer" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Customers />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/new" 
                  element={
                    <ProtectedRoute allowedRoles={["admin", "farmer", "fertilizer_seller", "instrument_seller"]}>
                      <NewListing />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/blognew" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <NewBlog />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/educationnew" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <NewEducation />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
