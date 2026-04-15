import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login.js";
import { Toaster } from "react-hot-toast";

import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/protectedRoute";
import SelectRole from "./pages/SelectRole.js";
import Navbar from "./components/navbar.js";
import Account from "./pages/Account.js";
import { useAppData } from "./context/AppContext.js";
import Restaurant from "./pages/Restaurant.js";
import RestaurantPage from "./pages/RestaurantPage.js";
import Cart from "./pages/Cart.js";
import AddAddressPage from "./pages/Address.js";
import Checkout from "./pages/Checkout.js";
import PaymentSucess from "./pages/PaymentSucess.js";
import OrderSucess from "./pages/OrderSucess.js";
import Orders from "./pages/Orders.js";
import OrderPage from "./pages/OrderPage.js";
import RiderDashboard from "./pages/RiderDashboard.js";
import Admin from "./pages/Admin.js";

const App = () => {
  const { user,loading } = useAppData();

  if(loading){
    return <h1 className="text-2xl font-bold text-red-500 text-center mt-56">Loading....</h1>
  }


  if (user && user.role === "seller") {
    return <Restaurant />;
  }

  if (user && user.role === "rider") {
    return <RiderDashboard />;
  }

   if (user && user.role === "admin") {
    return <Admin />;
  }
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/Login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/paymentsuccess/:paymentId"
              element={<PaymentSucess />}
            />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/ordersuccess" element={<OrderSucess />} />
            <Route path="/address" element={<AddAddressPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
