import { useState } from 'react';

function App() {
  const [matric, setMatric] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(matric);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white p-12 border border-brand-hairline shadow-sm">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="font-serif text-[28px] text-brand-ink mb-4">
            DELSU Result Advisor
          </h1>
          {/* Subtle Brass Accent Rule */}
          <div className="h-[2px] w-[40px] bg-brand-accent"></div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex flex-col space-y-2">
            <label 
              htmlFor="matric" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              Matriculation Number
            </label>
            <input
              id="matric"
              type="text"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              placeholder="e.g. FOS/22/23/123456"
              className="font-mono text-lg text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-ink text-white font-sans font-medium py-3 px-4 rounded-[3px] hover:bg-opacity-90 transition-opacity"
          >
            View Results
          </button>

        </form>
      </div>
    </div>
  );
}

export default App;
