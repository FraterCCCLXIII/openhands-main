import Navbar from '../../components/NavBar';
import Footer from '../../components/Footer';
import Team from '../../components/Team';

export default function TeamPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Team />
      </main>
      <Footer />
    </div>
  );
}
