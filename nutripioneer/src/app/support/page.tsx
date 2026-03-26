import Link from 'next/link';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import styles from './page.module.css';

export default function SupportPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logoWrapper}>
          <Image src="/logo.png" alt="NutriPioneer Logo" width={36} height={36} />
          <span className={styles.logo}>NutriPioneer</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/onboarding" className={styles.navLink}>Login</Link>
        </div>
      </nav>

      <main className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>Support & FAQs</h1>
        <span className={styles.lastUpdated}>Need help? We're here for you.</span>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p className={styles.text}>
            If you have any questions, issues, or feedback, please don't hesitate to reach out to our support team. We aim to respond to all inquiries within 24-48 hours.
          </p>
          <div style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
            <a 
              href="mailto:support@nutripioneer.com" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'background-color 0.2s ease'
              }}
            >
              <Mail size={18} />
              Email Support
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>How does NutriPioneer use AI?</h3>
            <p className={styles.text}>
              NutriPioneer uses AI to generate personalized nutrition limits, analyze foods, and recommend meal plans tailored to your specific conditions and preferences. We integrate with medical databases (like ICD-11) and nutrition APIs to provide context-aware recommendations.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Is my medical data secure?</h3>
            <p className={styles.text}>
              Yes, we apply industry-standard encryption to protect your data. Your medical profiles are contained within our secure database and processed through our AI without retaining specific personally identifiable information linked externally.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Can I use NutriPioneer with multiple medical conditions?</h3>
            <p className={styles.text}>
              Absolutely. In fact, that's what NutriPioneer is built for. You can select multiple conditions during onboarding, and our conflict engine will balance dietary constraints for all of them.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>How do I cancel my Pro subscription?</h3>
            <p className={styles.text}>
              If you have an active Pro subscription via App Store or web, you can manage or cancel it at any time by navigating to your Profile Dashboard and clicking on "Manage Subscription".
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <Link href="/terms" className={styles.footerLink}>Terms & Conditions</Link>
          <Link href="/support" className={styles.footerLink}>Support</Link>
        </div>
        <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} NutriPioneer. All rights reserved.</p>
      </footer>
    </div>
  );
}
