import React from 'react';
import { FiShield, FiAlertTriangle, FiMail } from 'react-icons/fi';

const Disclaimer = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[70vh]">
      <div className="glass-card p-8 md:p-12 space-y-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-anime-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-anime-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-anime-primary/20 rounded-full mb-2">
            <FiShield className="text-4xl text-anime-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            DMCA & Copyright Disclaimer
          </h1>
          <p className="text-anime-muted text-lg max-w-2xl mx-auto">
            Please read this disclaimer carefully before using AnimePh.
          </p>
        </div>

        <div className="space-y-8 relative z-10 mt-12 text-gray-300 leading-relaxed">
          
          <section className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" /> 1. No Hosted Content
            </h2>
            <p>
              <strong>AnimePh does not store, host, or upload any media files</strong> (such as video files, episode streams, or anime episodes) on its servers or databases. All video content is hosted by third-party services and embedded into our website via standard web embedding techniques (<code>&lt;iframe&gt;</code>).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Third-Party Content</h2>
            <p>
              AnimePh functions essentially as an index and database. Our service scrapes publicly available information and utilizes third-party APIs (such as Jikan API) to provide metadata such as titles, descriptions, and release dates. 
              Any embed codes or direct links to video streams are provided by unrelated, external third-party streaming platforms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Copyright Infringement</h2>
            <p>
              We completely respect the intellectual property rights of others. However, because we do not host the actual video files, we cannot guarantee the removal of copyrighted materials from third-party hosting services.
            </p>
            <p>
              If you are a copyright owner and you believe that any content linked or embedded on AnimePh infringes upon your copyrights, you must contact the <strong>third-party video hosting provider directly</strong>. Removing a link from AnimePh will not remove the video from the internet.
            </p>
          </section>

          <section className="space-y-4 bg-anime-primary/10 p-6 rounded-2xl border border-anime-primary/20 mt-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiMail className="text-anime-primary" /> 4. Contact Us
            </h2>
            <p>
              If you still have questions or wish to request the removal of a specific embed link from our index, please be prepared to provide a formal DMCA takedown notice containing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact URL on our website containing the embed link.</li>
              <li>Your contact information (Name, Email, etc).</li>
              <li>A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner.</li>
            </ul>
            <p className="pt-2 text-sm italic font-medium opacity-80">
              Disclaimer: Removing the link on our site does not take down the video file from the hosting source.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
