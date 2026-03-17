import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function TermsAndConditionsPage() {
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
        <h1 className={styles.pageTitle}>Terms & Conditions</h1>
        <span className={styles.lastUpdated}>Last Updated: March 17, 2026</span>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p className={styles.text}>
            By accessing and using NutriPioneer, you agree to be bound by these Terms and Conditions. 
            If you disagree with any part of these terms, you may not use our service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Medical Disclaimer</h2>
          <p className={styles.text}>
            <strong>NutriPioneer is not a substitute for professional medical advice, diagnosis, or treatment.</strong> 
            Always seek the advice of your physician or other qualified health provider with any questions you may have 
            regarding a medical condition, diet planning, or potential drug interactions.
          </p>
          <p className={styles.text}>
            While our AI and algorithms strictly follow established medical documentation and WHO ICD-11 guidelines, 
            we cannot guarantee 100% accuracy in food databases or ensure safety against all unforeseen allergic or 
            medical incidents.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Accounts</h2>
          <p className={styles.text}>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            You are responsible for safeguarding the password that you use to access the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Subscriptions and Payments</h2>
          <p className={styles.text}>
            Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and 
            periodic basis. Your subscription will automatically renew under the exact same conditions unless you cancel it 
            or NutriPioneer cancels it.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Limitation of Liability</h2>
          <p className={styles.text}>
            In no event shall NutriPioneer, nor its directors, employees, partners, agents, suppliers, or affiliates, 
            be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
            loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of 
            or inability to access or use the Service, particularly relating to dietary adherence or medical outcomes.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <Link href="/terms" className={styles.footerLink}>Terms & Conditions</Link>
        </div>
        <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} NutriPioneer. All rights reserved.</p>
      </footer>
    </div>
  );
}
