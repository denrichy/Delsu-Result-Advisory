import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-pure-canvas">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="px-[16px] md:px-[24px] pt-[80px] pb-[48px] md:pt-[120px] md:pb-[80px] flex flex-col items-center text-center max-w-[1280px] mx-auto">
        
        <span className="text-step-xs text-ash uppercase mb-[24px]">
          FOR DELSU COMPUTER SCIENCE STUDENTS
        </span>
        
        {/* Split-weight headline */}
        <h1 className="max-w-[900px] mb-[24px] md:mb-[32px]" style={{fontSize: 'clamp(32px, 8vw, 80px)', lineHeight: 1, letterSpacing: '-0.88px'}}>
          <span className="text-midnight-ink" style={{fontWeight: 700}}>Your academic record,</span>
          <br />
          <span className="text-midnight-ink" style={{fontWeight: 500}}>finally makes sense.</span>
        </h1>
        
        <p className="text-step-base-3 text-graphite max-w-[600px] mb-[40px]">
          Check your results, track your GPA, and ask questions about your own academic standing — all in one place.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-[12px] sm:gap-[16px] mb-[48px] md:mb-[64px] w-full sm:w-auto">
          <Link 
            to="/app/student/results"
            className="bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity w-full sm:w-auto text-center"
          >
            Look Up Results
          </Link>
          <a
            href="#for-advisers"
            onClick={(e) => { e.preventDefault(); document.getElementById('for-advisers')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-transparent text-midnight-ink border border-midnight-ink text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-mist transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            For Advisers
          </a>
        </div>

        {/* Hero Visual — Mock Record Card */}
        <div className="w-full max-w-[480px] bg-pure-canvas border border-fog rounded-[24px] p-[20px] md:p-[32px] text-left shadow-xl">
          {/* CGPA Display */}
          <div className="mb-[24px]">
            <span className="text-step-xs text-ash uppercase">CGPA</span>
            <div className="text-midnight-ink mt-[4px]" style={{fontSize: 'clamp(40px, 10vw, 56px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.39px'}}>
              4.40
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-fog mb-[16px]" />

          {/* Mock Course Rows */}
          {[
            { code: 'CSC 301', title: 'Data Structures', score: 74, grade: 'A' },
            { code: 'CSC 305', title: 'Computer Architecture', score: 68, grade: 'B' },
            { code: 'MTH 301', title: 'Numerical Methods', score: 52, grade: 'C' },
          ].map((course, i) => (
            <div key={i} className={`flex items-center justify-between py-[12px] ${i < 2 ? 'border-b border-fog' : ''}`}>
              <div>
                <div className="text-step-sm text-midnight-ink font-mono">{course.code}</div>
                <div className="text-step-xs text-graphite mt-[2px]">{course.title}</div>
              </div>
              <div className="flex items-center gap-[16px] text-right">
                <span className="text-step-sm text-graphite">{course.score}</span>
                <span className="text-step-sm-2 text-midnight-ink w-[16px]">{course.grade}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section — Mist band */}
      <section className="bg-mist py-[48px] md:py-[80px] px-[16px] md:px-[24px]">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[24px] md:gap-[32px]">
          
          <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
            <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
              Instant Lookup
            </h3>
            <p className="text-step-sm-2 text-graphite">
              Enter your matric number and see your full academic record in seconds.
            </p>
          </div>
          
          <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
            <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
              GPA Tracking
            </h3>
            <p className="text-step-sm-2 text-graphite">
              Semester and cumulative GPA, calculated automatically from your results.
            </p>
          </div>
          
          <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
            <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
              Ask Anything
            </h3>
            <p className="text-step-sm-2 text-graphite">
              Talk to an assistant that knows your academic record and can answer your questions.
            </p>
          </div>

        </div>
      </section>

      {/* For Advisers Section */}
      <section id="for-advisers" className="py-[48px] md:py-[80px] px-[16px] md:px-[24px] bg-pure-canvas">
        <div className="max-w-[1000px] mx-auto">

          <div className="mb-[48px]">
            <span className="text-step-xs text-ash uppercase">FOR ADVISERS</span>
            <h2 className="mt-[8px]" style={{fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, lineHeight: 1.13}}>
              <span className="text-midnight-ink">Built for the people</span>
              <br />
              <span className="text-graphite" style={{fontWeight: 500}}>who manage results.</span>
            </h2>
            <p className="text-step-base-3 text-graphite max-w-[520px] mt-[16px]">
              Compass gives academic advisers a secure, streamlined way to upload student broadsheets and keep result records accurate.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-[12px] sm:gap-[16px] mt-[32px]">
              <a
                href="/app/signup"
                className="bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[10px] px-[24px] hover:bg-opacity-90 transition-opacity"
              >
                Register as Adviser
              </a>
              <a
                href="/app/login"
                className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
              >
                Already have an account?
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">

            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">Upload Broadsheets</h3>
              <p className="text-step-sm-2 text-graphite">
                Submit Excel broadsheet files and let Compass parse and store student results automatically.
              </p>
            </div>

            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">Verified Access</h3>
              <p className="text-step-sm-2 text-graphite">
                Adviser accounts require admin approval before results can be uploaded, keeping the data trustworthy.
              </p>
            </div>

            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px]">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">Track Submissions</h3>
              <p className="text-step-sm-2 text-graphite">
                Review past uploads and their processing status from your adviser dashboard.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pt-[64px] pb-[32px] px-[24px] bg-pure-canvas border-t border-fog">
        <p className="text-step-xs text-ash">
          Compass — Built for Delta State University
        </p>
      </footer>

    </div>
  );
}
