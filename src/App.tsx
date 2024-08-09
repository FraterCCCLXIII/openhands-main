import { Outlet } from "react-router-dom";

const App = () => {
  return (
    <div>
      <h1 className='bg-red-500'>Hello world!</h1>
      <Outlet />
    </div>
  )
}

export default App;
