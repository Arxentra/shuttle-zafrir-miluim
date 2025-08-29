import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PickupLocation {
  name: string;
  url: string;
}

interface PickupLocationsProps {
  routeType: 'sabidor' | 'kiryat-arie';
}

export function PickupLocations({ routeType }: PickupLocationsProps) {
  const locations: Record<string, PickupLocation[]> = {
    sabidor: [
      {
        name: 'העלאה והורדה בנקודת איסוף סבידור',
        url: 'https://www.google.com/maps/place/32%C2%B004\'58.3%22N+34%C2%B047\'49.4%22E/@32.0828652,34.7992369,703m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d32.0828652!4d34.7970482?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D'
      },
      {
        name: 'העלאה והורדה בנקודת איסוף צומת סירקין',
        url: 'https://www.google.com/maps/place/32%C2%B004\'54.8%22N+34%C2%B054\'22.2%22E/@32.081878,34.906167,703m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d32.081878!4d34.906167?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D'
      }
    ],
    'kiryat-arie': [
      {
        name: 'העלאה והורדה בנקודת איסוף קריית אריה',
        url: 'https://www.google.com/maps/place/32%C2%B006\'19.1%22N+34%C2%B051\'48.4%22E/@32.105293,34.8656377,702m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d32.105293!4d34.863449?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D'
      }
    ]
  };

  const currentLocations = locations[routeType] || [];

  return (
    <div className="mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-100">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg sm:text-xl font-bold text-emerald-800">נקודות איסוף קבועות</h3>
      </div>
      
      <div className="space-y-3">
        {currentLocations.map((location, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-lg gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium text-emerald-800 text-sm sm:text-base">{location.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(location.url, '_blank')}
              className="flex items-center gap-2 hover:bg-emerald-100 hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              פתח במפות
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
        <p className="text-sm sm:text-base text-blue-800">
          <strong>חשוב:</strong> נקודות האיסוף הן קבועות לכל שאטל. אנא הגיעו לנקודת האיסוף המתאימה 5 דקות לפני הזמן המתוכנן.
        </p>
      </div>
    </div>
  );
}