import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const PromoBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 24,
    seconds: 38,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-[#00BFA5] to-[#00d4b8]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-2">
              Extra 20% OFF on Health Devices
            </h2>
            <p className="text-xl">
              Use Code: <span className="font-bold bg-white/20 px-3 py-1 rounded">DEVICE20</span>
            </p>
          </div>

          {/* Right Side - Timer */}
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="text-[#00A651]" size={20} />
              <span className="text-sm font-medium text-[#666666]">Offer ends in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="bg-[#00A651] text-white text-3xl font-bold px-4 py-3 rounded-lg min-w-[70px]">
                  {formatTime(timeLeft.hours)}
                </div>
                <span className="text-xs text-[#666666] mt-1 block">Hours</span>
              </div>
              <span className="text-3xl font-bold text-[#00A651]">:</span>
              <div className="text-center">
                <div className="bg-[#00A651] text-white text-3xl font-bold px-4 py-3 rounded-lg min-w-[70px]">
                  {formatTime(timeLeft.minutes)}
                </div>
                <span className="text-xs text-[#666666] mt-1 block">Minutes</span>
              </div>
              <span className="text-3xl font-bold text-[#00A651]">:</span>
              <div className="text-center">
                <div className="bg-[#00A651] text-white text-3xl font-bold px-4 py-3 rounded-lg min-w-[70px]">
                  {formatTime(timeLeft.seconds)}
                </div>
                <span className="text-xs text-[#666666] mt-1 block">Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
