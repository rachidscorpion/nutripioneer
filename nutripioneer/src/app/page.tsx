import Link from 'next/link';
import Image from 'next/image';
import { searchPhotos } from '@/lib/unsplash';
import {
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  ChefHat,
  ScanLine,
  Globe
} from 'lucide-react';
import * as motion from 'motion/react-client';
import styles from './page.module.css';

export default async function Page() {
  const photos = await searchPhotos('healthy food', 10);
  const bgImage = photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)].url : '/fallback-bg.jpg';

  const features = [
    {
      icon: <Activity strokeWidth={2} />,
      title: "Medical Intelligence",
      description: "Support for 55,000+ conditions including CKD, Diabetes, and PCOS via direct ICD-11 integration."
    },
    {
      icon: <ShieldCheck strokeWidth={2} />,
      title: "Drug-Nutrient Safety",
      description: "Real-time safety checks against your medications to prevent adverse interactions."
    },
    {
      icon: <ChefHat strokeWidth={2} />,
      title: "Personalized Menus",
      description: "AI-generated recipes that respect your taste buds and your doctor's orders."
    },
    {
      icon: <Zap strokeWidth={2} />,
      title: "Smart Grocery",
      description: "Auto-generated shopping lists synced with your meal plan."
    },
    {
      icon: <ScanLine strokeWidth={2} />,
      title: "Restaurant Rescue",
      description: "Scan any menu to find the safest options for your specific condition instantly."
    },
    {
      icon: <Globe strokeWidth={2} />,
      title: "Universal Access",
      description: "Just-in-Time onboarding means we support any rare condition you may have."
    }
  ];

  const workflowSteps = [
    { title: "Create Profile", description: "Enter your biometrics, dietary goals, and lifestyle preferences." },
    { title: "Add Conditions", description: "Search any medical condition from WHO's comprehensive ICD-11 database." },
    { title: "Log Medications", description: "List your medications for automated safety interactions." },
    { title: "Set Preferences", description: "Tell us your favorite foods, allergies, and cultural preferences." },
    { title: "Get Your Plan", description: "Receive your tailored meal plan with recipes and shopping lists." }
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logoWrapper}>
          <Image src="/logo.png" alt="NutriPioneer Logo" width={36} height={36} />
          <span className={styles.logo}>NutriPioneer</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/onboarding" className={styles.navLink}>Login</Link>
          <Link href="/onboarding" className={styles.navButton}>Get Started</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {bgImage && <img src={bgImage} alt="Background" className={styles.bgImage} />}
          <div className={styles.overlay} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={styles.heroContent}
        >
          <h1 className={styles.headline}>
            Eat Smarter.<br />
            <span className={styles.gradientText}>Live Healthier.</span>
          </h1>
          <p className={styles.subtext}>
            The intelligent nutrition platform that adapts to your biology. 
            Plan meals, track nutrients, and ensure medication safety in one elegant interface.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/onboarding" className={styles.primaryBtn}>
              <span>Start Your Journey</span>
              <ArrowRight strokeWidth={2.5} style={{ width: 20, height: 20 }} />
            </Link>
            <Link href="#features" className={styles.secondaryBtn}>Discover More</Link>
          </div>
        </motion.div>
      </section>

      <section className={styles.trustSection}>
        <p className={styles.sectionSubtitle}>Powered by trusted data sources</p>
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>WHO ICD-11</div>
          <div className={styles.trustItem}>USDA FoodData</div>
          <div className={styles.trustItem}>FatSecret API</div>
          <div className={styles.trustItem}>OpenAI GPT-4</div>
        </div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresWrapper}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={styles.sectionHeader}
          >
            <h2 className={styles.sectionTitle}>Why NutriPioneer?</h2>
            <p className={styles.sectionSubtitle}>
              Advanced technology meets holistic wellness. We handle the complexity of your health so you can focus on enjoying food.
            </p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={styles.featureCard}
              >
                <div className={styles.iconWrapper}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>From profile to plate in five simple steps</p>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineLine} />
          {workflowSteps.map((step, idx) => (
            <motion.div
              key={idx}
              className={styles.timelineItem}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
            >
              <div className={styles.timelineMarker} />
              <div className={styles.timelineContent}>
                <h3 className={styles.featureTitle}>{idx + 1}. {step.title}</h3>
                <p className={styles.featureDescription}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaCard}
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className={styles.ctaTitle}>Ready to Transform Your Health?</h2>
          <p className={styles.subtext} style={{ marginBottom: '2rem', marginTop: '1rem' }}>
            Join thousands who have revolutionized their health journey with personalized nutrition intelligence.
          </p>
          <Link href="/onboarding" className={styles.primaryBtn}>
            <span>Begin Your Transformation</span>
            <ArrowRight strokeWidth={2.5} style={{ width: 20, height: 20 }} />
          </Link>
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} NutriPioneer. All rights reserved.</p>
      </footer>
    </div>
  );
}
