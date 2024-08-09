import { Outlet } from "react-router-dom";
import { Header } from "./components/header";

const App = () => {
  return (
    <div className="bg-[#F1EAE0]">
      <Header onClickMenuButton={() => { }} />
      <Outlet />
    </div>
  )
}

export default App;
