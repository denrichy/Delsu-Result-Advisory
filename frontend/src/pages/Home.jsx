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
        
        <div className="max-w-[600px] mb-[40px] flex flex-col gap-[8px]">
          <p className="text-step-base-3 text-graphite">
            Check your results, track your GPA, and ask questions about your own academic standing — all in one place.
          </p>
          <p className="text-step-sm-2 text-ash">
            DELSU's result portal has been down for years. Compass gives you a real dashboard — and an AI advisor who actually knows your records.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-[12px] sm:gap-[16px] mb-[48px] md:mb-[64px] w-full sm:w-auto">
          <Link 
            to="/app/student/results"
            className="bg-midnight-ink text-pure-canvas text-step-base-2 rounded-[12px] py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity w-full sm:w-auto text-center"
          >
            Look Up Results
          </Link>
          <a
            href="#for-advisers"
            onClick={(e) => { e.preventDefault(); document.getElementById('for-advisers')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-transparent text-midnight-ink border border-midnight-ink text-step-base-2 rounded-[12px] py-[12px] px-[24px] hover:bg-mist transition-colors cursor-pointer w-full sm:w-auto text-center"
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-[64px] md:py-[100px] px-[16px] md:px-[24px] bg-pure-canvas">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-[48px] text-center">
            <h2 className="text-step-lg text-midnight-ink font-bold mb-[16px]">How it works</h2>
            <p className="text-step-base text-graphite max-w-[600px] mx-auto">
              A seamless flow from the adviser's desk directly to your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px] md:gap-[48px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-step-xs text-ash uppercase tracking-widest mb-[16px]">01</span>
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">Your adviser uploads results</h3>
              <p className="text-step-sm-2 text-graphite">
                A broadsheet gets processed automatically — no manual data entry required.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <span className="text-step-xs text-ash uppercase tracking-widest mb-[16px]">02</span>
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">You get notified instantly</h3>
              <p className="text-step-sm-2 text-graphite">
                When your results are published, you're notified right away.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <span className="text-step-xs text-ash uppercase tracking-widest mb-[16px]">03</span>
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">Ask Compass anything</h3>
              <p className="text-step-sm-2 text-graphite">
                Your AI advisor already knows your GPA, courses, and carryovers — just ask.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Ask Anything Section */}
      <section className="py-[64px] md:py-[100px] px-[16px] md:px-[24px] bg-mist">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-[48px] md:gap-[80px]">
          <div className="flex-1">
            <h2 className="text-step-lg text-midnight-ink font-bold mb-[24px]">
              Meet your AI Academic Advisor
            </h2>
            <p className="text-step-base text-graphite mb-[32px]">
              Stop guessing your GPA or manually calculating what you need to graduate. Compass understands your entire academic history and can answer complex questions about your progression instantly.
            </p>
          </div>

          <div className="flex-1 w-full max-w-[500px]">
            <div className="bg-pure-canvas border border-slate-shadow rounded-[24px] p-[16px] md:p-[24px] shadow-sm flex flex-col gap-[16px]">
              {/* User Mock Bubble */}
              <div className="flex items-start gap-[12px] flex-row-reverse">
                <div className="w-[32px] h-[32px] rounded-full bg-mist flex items-center justify-center text-midnight-ink text-[12px] font-bold flex-shrink-0 mt-2">
                  ME
                </div>
                <div className="px-[16px] py-[12px] rounded-[16px] max-w-[85%] text-step-sm-2 bg-midnight-ink text-pure-canvas rounded-tr-[4px]">
                  <p>Do I have any carryovers?</p>
                </div>
              </div>

              {/* AI Mock Bubble */}
              <div className="flex items-start gap-[12px]">
                <div className="w-[32px] h-[32px] rounded-full bg-brand-ink flex items-center justify-center text-pure-canvas text-[12px] font-bold flex-shrink-0 mt-2">
                  AI
                </div>
                <div className="px-[16px] py-[12px] rounded-[16px] max-w-[85%] text-step-sm-2 bg-mist/60 text-midnight-ink border border-fog rounded-tl-[4px]">
                  <p className="mb-2">Yes, you have <strong>1 outstanding course</strong>:</p>
                  <p className="font-mono text-xs bg-pure-canvas px-2 py-1 rounded border border-fog inline-block mb-2">MTH213</p>
                  <p>I suggest focusing on this early next semester since it carries 3 units and can drag down your CGPA.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Small Feature Mentions */}
      <section className="py-[64px] md:py-[100px] px-[16px] md:px-[24px] bg-pure-canvas">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-[24px]">
            
            {/* Core Features */}
            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] col-span-1 sm:col-span-1 md:col-span-2">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
                Instant Lookup
              </h3>
              <p className="text-step-sm-2 text-graphite">
                Enter your matric number and see your full academic record in seconds.
              </p>
            </div>
            
            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] col-span-1 sm:col-span-1 md:col-span-3">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
                GPA Tracking
              </h3>
              <p className="text-step-sm-2 text-graphite">
                Semester and cumulative GPA, calculated automatically from your results.
              </p>
            </div>

            {/* New Features */}
            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] col-span-1 md:col-span-2">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
                Carryover Tracking
              </h3>
              <p className="text-step-sm-2 text-graphite">
                Outstanding courses tracked automatically across every level.
              </p>
            </div>

            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] col-span-1 md:col-span-1">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
                Instant Notifications
              </h3>
              <p className="text-step-sm-2 text-graphite">
                Get notified the moment results are published.
              </p>
            </div>

            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] col-span-1 sm:col-span-2 md:col-span-2">
              <h3 className="text-step-base-2 text-midnight-ink mb-[8px]">
                Adviser Analytics
              </h3>
              <p className="text-step-sm-2 text-graphite">
                Advisers can see class performance, top students, and at-risk students at a glance.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* For Advisers Section */}
      <section id="for-advisers" className="py-[64px] md:py-[100px] px-[16px] md:px-[24px] bg-mist">
        <div className="max-w-[1280px] mx-auto">
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
                className="bg-midnight-ink text-pure-canvas text-step-base-2 rounded-[12px] py-[10px] px-[24px] hover:bg-opacity-90 transition-opacity"
              >
                Register as Adviser
              </a>
              <a
                href="/app/login"
                className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors mt-[10px] sm:mt-[0px]"
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

      {/* Final CTA Section */}
      <section className="py-[80px] md:py-[120px] px-[16px] md:px-[24px] bg-pure-canvas text-center">
        <div className="max-w-[800px] mx-auto flex flex-col items-center">
          <h2 className="text-step-xl text-midnight-ink font-bold mb-[32px]">
            Ready to see where you stand?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-[12px] sm:gap-[16px] w-full sm:w-auto">
            <Link 
              to="/app/student/results"
              className="bg-midnight-ink text-pure-canvas text-step-base-2 rounded-[12px] py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity w-full sm:w-auto text-center"
            >
              Look Up Results
            </Link>
            <a
              href="#for-advisers"
              onClick={(e) => { e.preventDefault(); document.getElementById('for-advisers')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-transparent text-midnight-ink border border-midnight-ink text-step-base-2 rounded-[12px] py-[12px] px-[24px] hover:bg-mist transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              For Advisers
            </a>
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
