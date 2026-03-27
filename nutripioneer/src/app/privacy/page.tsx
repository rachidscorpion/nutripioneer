import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function PrivacyPolicyPage() {
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
        <h1 className={styles.pageTitle}>Privacy Policy</h1>
        <span className={styles.lastUpdated}>Last Updated: March 17, 2026</span>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.text}>
            Welcome to NutriPioneer. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains what information we collect, how we use it, and your rights concerning your data.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
          <p className={styles.text}>
            We collect personal information that you voluntarily provide to us when you register on exploring our platform, including:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Account information (name, email address)</li>
            <li className={styles.listItem}>Health and biometric data (age, weight, height, medical conditions, medications)</li>
            <li className={styles.listItem}>Dietary preferences and restrictions</li>
            <li className={styles.listItem}>Usage data and meal planning choices</li>
          </ul>
          <p className={styles.text}>
            Given the sensitive nature of health information, including biometrics, ICD-11 condition data, and logged medications (via FDA RxNorm APIs), we apply industry-standard encryption to protect this data at rest and in transit. Your personally identifiable medical profiles remain strictly contained within our secure database and are processed through our secure AI agents without retaining specific PII links to your identity externally.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
          <p className={styles.text}>
            Your information is specifically utilized to provide context-aware, medically safe nutrition advice. We use your data to:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Generate personalized meal plans through AI and API integrations</li>
            <li className={styles.listItem}>Identify potential nutrient-drug interactions and conflicting dietary requirements</li>
            <li className={styles.listItem}>Improve our algorithms and conflict engine accuracy</li>
            <li className={styles.listItem}>Communicate with you regarding account updates and service enhancements</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Data Sharing and Third-Party AI Services</h2>
          <p className={styles.text}>
            We use third-party Artificial Intelligence (AI) services to provide personalized nutrition recommendations. By using our application, you grant us permission to share your data as follows:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Who the data is sent to:</strong> We integrate with <strong>OpenAI</strong> (a third-party AI provider) for analyzing and generating intelligent nutrition profiles. We also interface with food APIs (such as FatSecret and Edamam) for fetching recipe details.</li>
            <li className={styles.listItem}><strong>What data is sent:</strong> We send the medical conditions you optionally select or search for, biometrics, dietary preferences, and logged meals to OpenAI in order to generate safe nutritional guidelines.</li>
            <li className={styles.listItem}><strong>Data Protection:</strong> We confirm that the third-party AI service (OpenAI) provides the same or equal protection for your personal data. OpenAI’s API policies explicitly mandate that they do not use customer data submitted via their API to train or improve their models. Your data is processed transiently to generate responses and is not retained or associated with your identity by the AI provider.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Your Rights</h2>
          <p className={styles.text}>
            You have the right to access, update, or delete your personal information at any time. You can manage these settings 
            directly from your Profile Dashboard or contact our support team to request complete data erasure.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. AI Disclaimer</h2>
          <p className={styles.text}>
            NutriPioneer uses Artificial Intelligence (AI) to generate nutrition limits, analyze foods, and recommend meal plans. These analyses and results are surveyed and generated by AI and may not be 100% accurate. Your AI-generated nutrition limits can be edited based on your diet or physician's recommendations.
          </p>
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
