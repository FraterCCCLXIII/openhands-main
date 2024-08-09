import { Outlet } from "react-router-dom";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

const App = () => {
  return (
    <div className="bg-[#F1EAE0]">
      <Header onClickMenuButton={() => { }} />
      <Outlet />
      <Footer />
    </div>
  )
}

export default App;
