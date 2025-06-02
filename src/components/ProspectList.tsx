// src/components/ProspectList.tsx
import type { Prospect } from '../types';

interface ProspectListProps {
  prospects: Prospect[];
  city: string;
}

export default function ProspectList({ prospects, city }: ProspectListProps) {
  const exportToCSV = () => {
    const headers = ['Business Name', 'Industry', 'Address', 'Phone', 'Website', 'Rating', 'Priority'];
    const rows = prospects.map(p => [
      p.name,
      p.industry || p.type,
      p.address,
      p.phone || 'N/A',
      p.website || 'N/A',
      p.rating || 'N/A',
      p.priority
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects_${city}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getEquipmentSuggestions = (industry: string) => {
    const suggestions: Record<string, string[]> = {
      'Retail & E-commerce': ['POS Systems ($3K-$15K)', 'Security Systems ($5K-$20K)', 'Display Fixtures ($2K-$10K)'],
      'Food Service': ['Commercial Ovens ($5K-$25K)', 'Refrigeration ($3K-$15K)', 'POS Systems ($3K-$10K)'],
      'Healthcare': ['Medical Equipment ($10K-$45K)', 'Diagnostic Tools ($5K-$30K)', 'IT Systems ($5K-$20K)'],
      'Construction': ['Power Tools ($2K-$10K)', 'Safety Equipment ($3K-$15K)', 'Vehicles ($20K-$45K)'],
      'Manufacturing': ['CNC Machines ($15K-$45K)', 'Conveyors ($10K-$30K)', 'Forklifts ($15K-$35K)']
    };
    return suggestions[industry] || ['General Equipment ($5K-$25K)'];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <span className="w-6 h-6 mr-2 text-green-400">👥</span>
          Potential Prospects in {city}
        </h3>
        <button
          onClick={exportToCSV}
          className="bg-green-500/30 hover:bg-green-500/40 text-green-200 px-4 py-2 rounded-lg text-sm font-semibold border border-green-400/50 transition-all"
        >
          📥 Export to CSV
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {prospects.map((prospect, index) => (
          <div key={prospect.id || index} className="bg-blue-800/30 rounded-lg p-4 border border-blue-600/50 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-lg text-blue-100">{prospect.name}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                prospect.priority === 'High' ? 'bg-red-500/30 text-red-200 border border-red-400/50' :
                prospect.priority === 'Medium' ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50' :
                'bg-green-500/30 text-green-200 border border-green-400/50'
              }`}>
                {prospect.priority} Priority
              </span>
            </div>
            
            <p className="text-blue-300 text-sm mb-1">Industry: {prospect.industry || prospect.type}</p>
            
            {/* Equipment Suggestions Box */}
            <div className="bg-purple-500/20 rounded-lg p-3 mb-3 border border-purple-400/30">
              <p className="text-purple-200 font-semibold text-sm mb-2">💡 Likely Equipment Needs:</p>
              <ul className="space-y-1">
                {getEquipmentSuggestions(prospect.industry || prospect.type).map((equipment, idx) => (
                  <li key={idx} className="text-purple-300 text-xs">• {equipment}</li>
                ))}
              </ul>
            </div>

            {prospect.address && prospect.address !== 'Address not available' && (
              <p className="text-blue-400 text-xs mb-1">📍 {prospect.address}</p>
            )}
            {prospect.phone && (
              <p className="text-blue-400 text-xs mb-1">📞 {prospect.phone}</p>
            )} 
            {prospect.rating && (              <p className="text-blue-400 text-xs mb-2">⭐ Rating: {prospect.rating}/5</p>
            )}
            
            {/* Apollo Data */}
            {prospect.employeeCount && (
              <p className="text-purple-400 text-xs">👥 Employees: {prospect.employeeCount}</p>
            )}
            {prospect.decisionMaker && (
              <p className="text-green-400 text-xs mb-2">📧 Contact: {prospect.decisionMaker}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => window.open(`mailto:${prospect.email || ''}`)}
                className="bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 px-3 py-1 rounded text-xs font-semibold border border-blue-400/50 transition-all"
              >
                ✉️ Email
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(prospect.name + ' ' + prospect.address)}`)}
                className="bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 px-3 py-1 rounded text-xs font-semibold border border-purple-400/50 transition-all"
              >
                🔍 Research
              </button>
              {prospect.phone && (
                <button
                  onClick={() => window.open(`tel:${prospect.phone}`)}
                  className="bg-green-500/30 hover:bg-green-500/40 text-green-200 px-3 py-1 rounded text-xs font-semibold border border-green-400/50 transition-all"
                >
                  📞 Call
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}