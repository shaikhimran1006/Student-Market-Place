import Router from './router';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ChatWidget from './components/UI/ChatWidget';
import { WishlistProvider } from './context/WishlistContext';

function App() {
  return (
    <WishlistProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Router />
          </div>
        </main>
        <ChatWidget />
        <Footer />
      </div>
    </WishlistProvider>
  );
}

export default App;
