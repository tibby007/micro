import React from 'react';

const IndustriesSection: React.FC = () => {
  return (
    <div className="mt-8 bg-gray-800 rounded-lg p-8">
      {/* Header Section */}
      <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
        <span className="text-red-500 mr-2">🎯</span>
        Micro Ticket Equipment by Industry
      </h2>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-yellow-500 mr-2">💰</span>
            Why Micro Tickets Win
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>Deal Size: <span className="text-green-500 font-bold">$2.5K - $45K</span></p>
            <p>Commission: <span className="text-green-500 font-bold">4% - 7%</span></p>
            <p>Close Rate: <span className="text-green-500 font-bold">25% - 40%</span></p>
            <p>Speed: <span className="text-green-500 font-bold">7-14 days</span></p>
            <p className="text-sm pt-2">Higher volume, faster closes, less competition than big ticket deals</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-green-500 mr-2">📊</span>
            Micro Ticket ROI
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>Avg Commission: <span className="text-green-500 font-bold">$750 - $3,150</span></p>
            <p>Monthly Volume: <span className="text-yellow-500 font-bold">8-15 deals</span></p>
            <p>Time Investment: <span className="text-blue-500 font-bold">2-3 hrs/deal</span></p>
            <p>Success Rate: <span className="text-green-500 font-bold">Much Higher</span></p>
            <p className="text-sm pt-2">Perfect for scaling to 6-figure income through consistent volume</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-red-500 mr-2">🎯</span>
            6-Figure Math
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>Target Income: <span className="text-green-500 font-bold">$100,000</span></p>
            <p>Avg Commission: <span className="text-yellow-500 font-bold">$1,500</span></p>
            <p>Deals Needed: <span className="text-blue-500 font-bold">67 deals/year</span></p>
            <p>Monthly Goal: <span className="text-green-500 font-bold">6 deals/month</span></p>
            <p className="text-sm pt-2">Much more achievable than chasing big ticket deals!</p>
          </div>
        </div>
      </div>

      {/* Equipment Categories */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="text-red-500 mr-2">🎯</span>
          Micro Ticket Equipment Categories by Industry
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Restaurants */}
          <div>
            <h4 className="text-lg font-bold text-blue-400 mb-3">Restaurants ($5K-$35K)</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• POS Systems ($3K-$12K)</li>
              <li>• Commercial Ovens ($8K-$25K)</li>
              <li>• Refrigeration Units ($4K-$16K)</li>
              <li>• Food Prep Equipment ($2K-$8K)</li>
              <li>• Espresso Machines ($5K-$20K)</li>
            </ul>
          </div>

          {/* Retail Stores */}
          <div>
            <h4 className="text-lg font-bold text-green-400 mb-3">Retail Stores ($3K-$25K)</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• POS & Payment Systems ($2K-$8K)</li>
              <li>• Security Cameras ($3K-$12K)</li>
              <li>• Display Fixtures ($4K-$15K)</li>
              <li>• Inventory Scanners ($2K-$6K)</li>
              <li>• Digital Signage ($5K-$18K)</li>
            </ul>
          </div>

          {/* Medical Offices */}
          <div>
            <h4 className="text-lg font-bold text-yellow-400 mb-3">Medical Offices ($8K-$45K)</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Digital X-Ray ($15K-$45K)</li>
              <li>• Patient Monitors ($8K-$25K)</li>
              <li>• Ultrasound Equipment ($12K-$35K)</li>
              <li>• EMR Software/Hardware ($5K-$15K)</li>
              <li>• Dental Chairs ($10K-$30K)</li>
            </ul>
          </div>

          {/* Auto Repair */}
          <div>
            <h4 className="text-lg font-bold text-purple-400 mb-3">Auto Repair ($5K-$40K)</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Diagnostic Equipment ($8K-$25K)</li>
              <li>• Lifts & Hoists ($10K-$35K)</li>
              <li>• Air Compressors ($3K-$12K)</li>
              <li>• Tire Changers ($5K-$15K)</li>
              <li>• Paint Booths ($15K-$40K)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustriesSection;
