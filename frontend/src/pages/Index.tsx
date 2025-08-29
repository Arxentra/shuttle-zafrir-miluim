
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import DynamicShuttleBrochure from '@/components/DynamicShuttleBrochure';
import ChatWidget from '@/components/ChatWidget';

const Index = () => {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <ThemeToggle />
        <Link to="/admin/auth">
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <DynamicShuttleBrochure />
      <ChatWidget />
    </div>
  );
};

export default Index;
